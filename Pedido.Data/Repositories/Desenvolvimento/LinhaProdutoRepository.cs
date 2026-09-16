using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class LinhaProdutoRepository : BaseRepository, ILinhaProdutoRepository
{
    public LinhaProdutoRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(LinhaProduto linhaProduto)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.linha_produto
            (
                linha_produto_id,
                linha,
                numero_inicial,
                numero_final,
                categoria,
                genero,
                exclusiva,
                cliente_id,
                processo_produtivo,
                fabricante_id,
                rendimento
            )
            VALUES
            (
                @linha_produto_id,
                @linha,
                @numero_inicial,
                @numero_final,
                @categoria,
                @genero,
                @exclusiva,
                @cliente_id,
                @processo_produtivo,
                @fabricante_id,
                @rendimento
            )
            RETURNING linha_produto_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = linhaProduto.LinhaProdutoId;
            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = linhaProduto.Linha;
            cmd.Parameters.Add("numero_inicial", NpgsqlDbType.Smallint).Value = linhaProduto.NumeroInicial;
            cmd.Parameters.Add("numero_final", NpgsqlDbType.Smallint).Value = linhaProduto.NumeroFinal;
            cmd.Parameters.Add("categoria", NpgsqlDbType.Smallint).Value = (short)linhaProduto.Categoria;
            cmd.Parameters.Add("genero", NpgsqlDbType.Smallint).Value = (short)linhaProduto.Genero;
            cmd.Parameters.Add("exclusiva", NpgsqlDbType.Boolean).Value = linhaProduto.Exclusiva;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = linhaProduto.ClienteId.HasValue ? linhaProduto.ClienteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("processo_produtivo", NpgsqlDbType.Smallint).Value = (short)linhaProduto.ProcessoProdutivo;
            cmd.Parameters.Add("fabricante_id", NpgsqlDbType.Uuid).Value = linhaProduto.FabricanteId.HasValue ? linhaProduto.FabricanteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("rendimento", NpgsqlDbType.Numeric).Value = linhaProduto.Rendimento;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<LinhaProdutoGetResponse>> Obter(LinhaProdutoGetRequest request)
    {
        var linhas = new List<LinhaProdutoGetResponse>();

        string sql = @"
            SELECT
                linha_produto_id,
                linha,
                numero_inicial,
                numero_final,
                categoria,
                genero,
                exclusiva,
                linha_produto.cliente_id,
                COALESCE(NULLIF(BTRIM(cliente.razao_social), ''), cliente.fantasia, '') AS cliente,
                processo_produtivo,
                linha_produto.fabricante_id,
                COALESCE(NULLIF(BTRIM(fornecedor.razao_social), ''), fornecedor.fantasia, '') AS fabricante,
                rendimento
            FROM
                pedido_certo_ai.linha_produto
            LEFT JOIN
                pedido_certo_ai.fornecedor ON fornecedor.fornecedor_id = linha_produto.fabricante_id
            LEFT JOIN
                pedido_certo_ai.cliente ON cliente.cliente_id = linha_produto.cliente_id
            WHERE 1 = 1
        ";

        if (request.Linha.HasValue) sql += " AND linha_produto.linha = @linha";
        if (request.Categoria.HasValue) sql += " AND linha_produto.categoria = @categoria";
        if (request.Genero.HasValue) sql += " AND linha_produto.genero = @genero";
        if (request.FabricanteId.HasValue) sql += " AND linha_produto.fabricante_id = @fabricante_id";

        sql += $" ORDER BY {ObterOrdenacao(request.Sort)} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = request.Linha ?? 0;
            cmd.Parameters.Add("categoria", NpgsqlDbType.Smallint).Value = request.Categoria.HasValue ? (short)request.Categoria.Value : (short)0;
            cmd.Parameters.Add("genero", NpgsqlDbType.Smallint).Value = request.Genero.HasValue ? (short)request.Genero.Value : (short)0;
            cmd.Parameters.Add("fabricante_id", NpgsqlDbType.Uuid).Value = request.FabricanteId.HasValue ? request.FabricanteId.Value : Guid.Empty;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                linhas.Add(new LinhaProdutoGetResponse
                {
                    LinhaProdutoId = reader.GetGuid("linha_produto_id"),
                    Linha = reader.GetInt32("linha"),
                    NumeroInicial = reader.GetInt16(reader.GetOrdinal("numero_inicial")),
                    NumeroFinal = reader.GetInt16(reader.GetOrdinal("numero_final")),
                    Categoria = (CategoriaLinhaProduto)reader.GetInt16(reader.GetOrdinal("categoria")),
                    Genero = (GeneroLinhaProduto)reader.GetInt16(reader.GetOrdinal("genero")),
                    Exclusiva = reader.GetBoolean("exclusiva"),
                    ClienteId = reader.GetGuidNullable("cliente_id"),
                    Cliente = reader.GetString("cliente"),
                    ProcessoProdutivo = (ProcessoProdutivoLinhaProduto)reader.GetInt16(reader.GetOrdinal("processo_produtivo")),
                    FabricanteId = reader.GetGuidNullable("fabricante_id"),
                    Fabricante = reader.GetString("fabricante"),
                    Rendimento = reader.GetDecimal("rendimento")
                });
            }

            return linhas;
        }
        catch
        {
            throw;
        }
    }

    public async Task<LinhaProduto?> Obter(Guid linhaProdutoId)
    {
        const string sql = @"
            SELECT
                linha_produto_id,
                linha,
                numero_inicial,
                numero_final,
                categoria,
                genero,
                exclusiva,
                linha_produto.cliente_id,
                COALESCE(NULLIF(BTRIM(cliente.razao_social), ''), cliente.fantasia, '') AS cliente,
                processo_produtivo,
                linha_produto.fabricante_id,
                COALESCE(NULLIF(BTRIM(fornecedor.razao_social), ''), fornecedor.fantasia, '') AS fabricante,
                rendimento
            FROM
                pedido_certo_ai.linha_produto
            LEFT JOIN
                pedido_certo_ai.fornecedor ON fornecedor.fornecedor_id = linha_produto.fabricante_id
            LEFT JOIN
                pedido_certo_ai.cliente ON cliente.cliente_id = linha_produto.cliente_id
            WHERE
                linha_produto.linha_produto_id = @linha_produto_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = linhaProdutoId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return new LinhaProduto
            {
                LinhaProdutoId = reader.GetGuid("linha_produto_id"),
                Linha = reader.GetInt32("linha"),
                NumeroInicial = reader.GetInt16(reader.GetOrdinal("numero_inicial")),
                NumeroFinal = reader.GetInt16(reader.GetOrdinal("numero_final")),
                Categoria = (CategoriaLinhaProduto)reader.GetInt16(reader.GetOrdinal("categoria")),
                Genero = (GeneroLinhaProduto)reader.GetInt16(reader.GetOrdinal("genero")),
                Exclusiva = reader.GetBoolean("exclusiva"),
                ClienteId = reader.GetGuidNullable("cliente_id"),
                Cliente = reader.GetString("cliente"),
                ProcessoProdutivo = (ProcessoProdutivoLinhaProduto)reader.GetInt16(reader.GetOrdinal("processo_produtivo")),
                FabricanteId = reader.GetGuidNullable("fabricante_id"),
                Fabricante = reader.GetString("fabricante"),
                Rendimento = reader.GetDecimal("rendimento")
            };
        }
        catch
        {
            throw;
        }
    }

    public async Task<int> Atualizar(LinhaProduto linhaProduto)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.linha_produto
            SET
                linha = @linha,
                numero_inicial = @numero_inicial,
                numero_final = @numero_final,
                categoria = @categoria,
                genero = @genero,
                exclusiva = @exclusiva,
                cliente_id = @cliente_id,
                processo_produtivo = @processo_produtivo,
                fabricante_id = @fabricante_id,
                rendimento = @rendimento
            WHERE
                linha_produto_id = @linha_produto_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = linhaProduto.LinhaProdutoId;
            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = linhaProduto.Linha;
            cmd.Parameters.Add("numero_inicial", NpgsqlDbType.Smallint).Value = linhaProduto.NumeroInicial;
            cmd.Parameters.Add("numero_final", NpgsqlDbType.Smallint).Value = linhaProduto.NumeroFinal;
            cmd.Parameters.Add("categoria", NpgsqlDbType.Smallint).Value = (short)linhaProduto.Categoria;
            cmd.Parameters.Add("genero", NpgsqlDbType.Smallint).Value = (short)linhaProduto.Genero;
            cmd.Parameters.Add("exclusiva", NpgsqlDbType.Boolean).Value = linhaProduto.Exclusiva;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = linhaProduto.ClienteId.HasValue ? linhaProduto.ClienteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("processo_produtivo", NpgsqlDbType.Smallint).Value = (short)linhaProduto.ProcessoProdutivo;
            cmd.Parameters.Add("fabricante_id", NpgsqlDbType.Uuid).Value = linhaProduto.FabricanteId.HasValue ? linhaProduto.FabricanteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("rendimento", NpgsqlDbType.Numeric).Value = linhaProduto.Rendimento;

            return await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarLinhaExiste(int linha, Guid? clienteId, Guid ignoreId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.linha_produto
            WHERE
                linha = @linha
            AND
                (
                    (cliente_id IS NULL AND @cliente_id IS NULL)
                    OR cliente_id = @cliente_id
                )
            AND
                linha_produto_id <> @ignoreId
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = linha;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = clienteId.HasValue ? clienteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("ignoreId", NpgsqlDbType.Uuid).Value = ignoreId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> VerificarLinhaProdutoExiste(Guid linhaProdutoId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.linha_produto
            WHERE
                linha_produto_id = @linha_produto_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_produto_id", NpgsqlDbType.Uuid).Value = linhaProdutoId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

    private static string ObterOrdenacao(string? sort)
    {
        return sort?.Trim().ToLowerInvariant() switch
        {
            "linha desc" => "linha desc",
            "categoria asc" => "categoria asc",
            "categoria desc" => "categoria desc",
            "genero asc" => "genero asc",
            "genero desc" => "genero desc",
            "fabricante asc" => "fabricante asc",
            "fabricante desc" => "fabricante desc",
            _ => "linha asc"
        };
    }
}