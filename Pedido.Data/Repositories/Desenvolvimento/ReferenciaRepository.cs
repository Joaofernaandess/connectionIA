using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class ReferenciaRepository : BaseRepository, IReferenciaRepository
{
    public ReferenciaRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Referencia referencia)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.referencia
            (
                referencia_id,
                linha_id,
                numero_referencia,
                referencia,
                sigla,
                observacao
            )
            VALUES
            (
                @referencia_id,
                @linha_id,
                @numero_referencia,
                @referencia,
                @sigla,
                @observacao
            )
            RETURNING referencia_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referencia.ReferenciaId;
            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = referencia.LinhaId;
            cmd.Parameters.Add("numero_referencia", NpgsqlDbType.Integer).Value = referencia.NumeroReferencia;
            cmd.Parameters.Add("referencia", NpgsqlDbType.Varchar).Value = referencia.CodigoReferencia;
            cmd.Parameters.Add("sigla", NpgsqlDbType.Varchar).Value = referencia.Sigla;
            cmd.Parameters.Add("observacao", NpgsqlDbType.Varchar).Value = (object?)referencia.Observacao ?? DBNull.Value;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<ReferenciaCorResponse> CadastrarCor(ReferenciaCor referenciaCor)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.referencia_cor
            (
                referencia_id,
                cor_id
            )
            VALUES
            (
                @referencia_id,
                @cor_id
            )
            RETURNING
                referencia_id,
                cor_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaCor.ReferenciaId;
            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = referenciaCor.CorId;

            await using var reader = await cmd.ExecuteReaderAsync();
            await reader.ReadAsync();

            return new ReferenciaCorResponse
            {
                ReferenciaId = reader.GetGuid("referencia_id"),
                CorId = reader.GetGuid("cor_id")
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ReferenciaGetResponse>> Obter(ReferenciaGetRequest request)
    {
        var referencias = new List<ReferenciaGetResponse>();

        string sql = @"
            SELECT
                referencia.referencia_id,
                referencia.linha_id,
                referencia_cor.cor_id,
                linha.linha,
                referencia.numero_referencia,
                referencia.referencia,
                referencia.sigla,
                COALESCE(cor.cor_descricao, '') AS cor_descricao,
                COALESCE(cor.cor_codigo, '') AS cor_codigo,
                COALESCE(referencia.referencia || '-' || cor.cor_codigo, '') AS referencia_cor,
                referencia.observacao,
                referencia.data_criacao
            FROM
                pedido_certo_ai.referencia
            INNER JOIN
                pedido_certo_ai.linha ON linha.linha_id = referencia.linha_id
            LEFT JOIN
                LATERAL (
                    SELECT
                        referencia_id,
                        cor_id
                    FROM
                        pedido_certo_ai.referencia_cor
                    WHERE
                        referencia_cor.referencia_id = referencia.referencia_id
                    ORDER BY
                        referencia_cor.cor_id
                    LIMIT 1
                ) referencia_cor ON true
            LEFT JOIN
                pedido_certo_ai.cor ON cor.cor_id = referencia_cor.cor_id
            WHERE 1 = 1
        ";

        if (request.LinhaId.HasValue) sql += " AND referencia.linha_id = @linha_id";
        if (request.NumeroReferencia.HasValue) sql += " AND referencia.numero_referencia = @numero_referencia";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "referencia.numero_referencia desc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = request.LinhaId.HasValue ? request.LinhaId.Value : Guid.Empty;
            cmd.Parameters.Add("numero_referencia", NpgsqlDbType.Integer).Value = request.NumeroReferencia ?? 0;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                referencias.Add(new ReferenciaGetResponse
                {
                    ReferenciaId = reader.GetGuid("referencia_id"),
                    LinhaId = reader.GetGuid("linha_id"),
                    CorId = reader.GetGuidNullable("cor_id"),
                    NumeroLinha = reader.GetInt32("linha"),
                    NumeroReferencia = reader.GetInt32("numero_referencia"),
                    CodigoReferencia = reader.GetString("referencia"),
                    CodigoReferenciaCor = reader.GetString("referencia_cor"),
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

    public async Task<Referencia?> Obter(Guid referenciaId)
    {
        const string sql = @"
            SELECT
                referencia.referencia_id,
                referencia.linha_id,
                referencia.numero_referencia,
                referencia.referencia,
                referencia.sigla,
                referencia.observacao,
                referencia.data_criacao
            FROM
                pedido_certo_ai.referencia
            WHERE
                referencia.referencia_id = @referencia_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return new Referencia
            {
                ReferenciaId = reader.GetGuid("referencia_id"),
                LinhaId = reader.GetGuid("linha_id"),
                NumeroReferencia = reader.GetInt32("numero_referencia"),
                CodigoReferencia = reader.GetString("referencia"),
                Sigla = reader.GetString("sigla"),
                Observacao = reader.GetStringNullable("observacao"),
                DataCriacao = reader.GetDateTime("data_criacao")
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<ReferenciaProximaResponse?> ObterProxima(Guid linhaId)
    {
        const string sql = @"
            SELECT
                linha.linha_id,
                linha.linha,
                COALESCE(MAX(referencia.numero_referencia), linha.linha) + 1 AS proxima_referencia
            FROM
                pedido_certo_ai.linha
            LEFT JOIN
                pedido_certo_ai.referencia ON referencia.linha_id = linha.linha_id
            WHERE
                linha.linha_id = @linha_id
            GROUP BY
                linha.linha_id,
                linha.linha
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = linhaId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            var proximaReferencia = reader.GetInt32("proxima_referencia");

            return new ReferenciaProximaResponse
            {
                LinhaId = reader.GetGuid("linha_id"),
                NumeroLinha = reader.GetInt32("linha"),
                ProximaReferencia = proximaReferencia,
                CodigoReferencia = proximaReferencia.ToString()
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<ReferenciaCorResponse>> ObterCores(Guid referenciaId)
    {
        var cores = new List<ReferenciaCorResponse>();

        const string sql = @"
            SELECT
                referencia_cor.referencia_id,
                referencia_cor.cor_id,
                referencia.referencia || '-' || cor.cor_codigo AS referencia_cor,
                COALESCE(cor.cor_descricao, '') AS cor_descricao,
                COALESCE(cor.cor_codigo, '') AS cor_codigo
            FROM
                pedido_certo_ai.referencia_cor
            INNER JOIN
                pedido_certo_ai.referencia ON referencia.referencia_id = referencia_cor.referencia_id
            INNER JOIN
                pedido_certo_ai.cor ON cor.cor_id = referencia_cor.cor_id
            WHERE
                referencia_cor.referencia_id = @referencia_id
            ORDER BY
                cor.cor_codigo;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                cores.Add(new ReferenciaCorResponse
                {
                    ReferenciaId = reader.GetGuid("referencia_id"),
                    CorId = reader.GetGuid("cor_id"),
                    CodigoReferenciaCor = reader.GetString("referencia_cor"),
                    CorDescricao = reader.GetString("cor_descricao"),
                    CorCodigo = reader.GetString("cor_codigo")
                });
            }

            return cores;
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(Referencia referencia)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.referencia
            SET
                linha_id = @linha_id,
                referencia = @referencia,
                sigla = @sigla,
                observacao = @observacao
            WHERE
                referencia_id = @referencia_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referencia.ReferenciaId;
            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = referencia.LinhaId;
            cmd.Parameters.Add("referencia", NpgsqlDbType.Varchar).Value = referencia.CodigoReferencia;
            cmd.Parameters.Add("sigla", NpgsqlDbType.Varchar).Value = referencia.Sigla;
            cmd.Parameters.Add("observacao", NpgsqlDbType.Varchar).Value = (object?)referencia.Observacao ?? DBNull.Value;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarReferenciaCorExiste(Guid referenciaId, Guid corId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.referencia_cor
            WHERE
                referencia_id = @referencia_id
            AND
                cor_id = @cor_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;
            cmd.Parameters.Add("cor_id", NpgsqlDbType.Uuid).Value = corId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarReferenciaExiste(Guid linhaId, int numeroReferencia)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.referencia
            WHERE
                linha_id = @linha_id
            AND
                numero_referencia = @numero_referencia
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = linhaId;
            cmd.Parameters.Add("numero_referencia", NpgsqlDbType.Integer).Value = numeroReferencia;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarReferenciaExiste(Guid referenciaId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.referencia
            WHERE
                referencia_id = @referencia_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("referencia_id", NpgsqlDbType.Uuid).Value = referenciaId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }
}
