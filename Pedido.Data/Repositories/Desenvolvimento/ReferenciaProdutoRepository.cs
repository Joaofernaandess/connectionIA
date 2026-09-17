using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class ReferenciaProdutoRepository : BaseRepository, IReferenciaProdutoRepository
{
    public ReferenciaProdutoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(ReferenciaProduto referenciaProduto)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.referencia_produto
            (
                referencia_produto_id,
                linha_produto_id,
                cor_id,
                numero_referencia,
                referencia,
                sigla,
                observacao
            )
            VALUES
            (
                @referencia_produto_id,
                @linha_produto_id,
                @cor_id,
                @numero_referencia,
                @referencia,
                @sigla,
                @observacao
            )
            RETURNING referencia_produto_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_produto_id", NpgsqlDbType.Uuid).Value = referenciaProduto.ReferenciaProdutoId;
            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = referenciaProduto.LinhaProdutoId;
            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = referenciaProduto.CorId.HasValue ? referenciaProduto.CorId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("numero_referencia", NpgsqlDbType.Integer).Value = referenciaProduto.NumeroReferencia;
            cmd.Parameters.Add("referencia", NpgsqlDbType.Varchar).Value = referenciaProduto.Referencia;
            cmd.Parameters.Add("sigla", NpgsqlDbType.Varchar).Value = referenciaProduto.Sigla;
            cmd.Parameters.Add("observacao", NpgsqlDbType.Varchar).Value = (object?)referenciaProduto.Observacao ?? DBNull.Value;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ReferenciaProdutoGetResponse>> Obter(ReferenciaProdutoGetRequest request)
    {
        var referencias = new List<ReferenciaProdutoGetResponse>();

        string sql = @"
            SELECT
                referencia_produto.referencia_produto_id,
                referencia_produto.linha_produto_id,
                referencia_produto.cor_id,
                linha_produto.linha,
                referencia_produto.numero_referencia,
                referencia_produto.referencia,
                referencia_produto.sigla,
                COALESCE(cor.cor_descricao, '') AS cor_descricao,
                COALESCE(cor.cor_codigo, '') AS cor_codigo,
                referencia_produto.observacao,
                referencia_produto.data_criacao
            FROM
                pedido_certo_ai.referencia_produto
            INNER JOIN
                pedido_certo_ai.linha_produto ON linha_produto.linha_produto_id = referencia_produto.linha_produto_id
            LEFT JOIN
                pedido_certo_ai.cor ON cor.cor_id = referencia_produto.cor_id
            WHERE 1 = 1
        ";

        if (request.LinhaProdutoId.HasValue) sql += " AND referencia_produto.linha_produto_id = @linha_produto_id";

        sql += " ORDER BY referencia_produto.numero_referencia DESC LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = request.LinhaProdutoId.HasValue ? request.LinhaProdutoId.Value : Guid.Empty;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                referencias.Add(new ReferenciaProdutoGetResponse
                {
                    ReferenciaProdutoId = reader.GetGuid("referencia_produto_id"),
                    LinhaProdutoId = reader.GetGuid("linha_produto_id"),
                    CorId = reader.GetGuidNullable("cor_id"),
                    Linha = reader.GetInt32("linha"),
                    NumeroReferencia = reader.GetInt32("numero_referencia"),
                    Referencia = reader.GetString("referencia"),
                    Sigla = reader.GetString("sigla"),
                    CorDescricao = reader.GetString("cor_descricao"),
                    CorCodigo = reader.GetString("cor_codigo"),
                    Observacao = reader.GetStringNullable("observacao"),
                    DataCriacao = reader.GetDateTime("data_criacao")
                });
            }

            return referencias;
        }
        catch
        {
            throw;
        }
    }

    public async Task<ReferenciaProdutoProximaResponse?> ObterProxima(Guid linhaProdutoId)
    {
        const string sql = @"
            SELECT
                linha_produto.linha_produto_id,
                linha_produto.linha,
                COALESCE(MAX(referencia_produto.numero_referencia), linha_produto.linha) + 1 AS proxima_referencia
            FROM
                pedido_certo_ai.linha_produto
            LEFT JOIN
                pedido_certo_ai.referencia_produto ON referencia_produto.linha_produto_id = linha_produto.linha_produto_id
            WHERE
                linha_produto.linha_produto_id = @linha_produto_id
            GROUP BY
                linha_produto.linha_produto_id,
                linha_produto.linha
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = linhaProdutoId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            var proximaReferencia = reader.GetInt32("proxima_referencia");

            return new ReferenciaProdutoProximaResponse
            {
                LinhaProdutoId = reader.GetGuid("linha_produto_id"),
                Linha = reader.GetInt32("linha"),
                ProximaReferencia = proximaReferencia,
                Referencia = proximaReferencia.ToString()
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarReferenciaExiste(Guid linhaProdutoId, int numeroReferencia)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.referencia_produto
            WHERE
                linha_produto_id = @linha_produto_id
            AND
                numero_referencia = @numero_referencia
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = linhaProdutoId;
            cmd.Parameters.Add("numero_referencia", NpgsqlDbType.Integer).Value = numeroReferencia;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }
}
