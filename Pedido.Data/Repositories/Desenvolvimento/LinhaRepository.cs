using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class LinhaRepository : BaseRepository, ILinhaRepository
{
    public LinhaRepository(IDbConnection connection) : base(connection) { }

    public async Task<Guid> Cadastrar(Linha linha)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.linha
            (
                linha_id,
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
                @linha_id,
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
            RETURNING linha_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = linha.LinhaId;
            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = linha.NumeroLinha;
            cmd.Parameters.Add("numero_inicial", NpgsqlDbType.Smallint).Value = linha.NumeroInicial;
            cmd.Parameters.Add("numero_final", NpgsqlDbType.Smallint).Value = linha.NumeroFinal;
            cmd.Parameters.Add("categoria", NpgsqlDbType.Smallint).Value = (short)linha.Categoria;
            cmd.Parameters.Add("genero", NpgsqlDbType.Smallint).Value = (short)linha.Genero;
            cmd.Parameters.Add("exclusiva", NpgsqlDbType.Boolean).Value = linha.Exclusiva;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = linha.ClienteId.HasValue ? linha.ClienteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("processo_produtivo", NpgsqlDbType.Smallint).Value = (short)linha.ProcessoProdutivo;
            cmd.Parameters.Add("fabricante_id", NpgsqlDbType.Uuid).Value = linha.FabricanteId.HasValue ? linha.FabricanteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("rendimento", NpgsqlDbType.Numeric).Value = linha.Rendimento;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<LinhaGetResponse>> Obter(LinhaGetRequest request)
    {
        var linhas = new List<LinhaGetResponse>();

        string sql = @"
            SELECT
                linha_id,
                linha,
                numero_inicial,
                numero_final,
                categoria,
                genero,
                exclusiva,
                linha.cliente_id,
                COALESCE(NULLIF(BTRIM(cliente.razao_social), ''), cliente.fantasia, '') AS cliente,
                processo_produtivo,
                linha.fabricante_id,
                COALESCE(NULLIF(BTRIM(fornecedor.razao_social), ''), fornecedor.fantasia, '') AS fabricante,
                rendimento
            FROM
                pedido_certo_ai.linha
            LEFT JOIN
                pedido_certo_ai.fornecedor ON fornecedor.fornecedor_id = linha.fabricante_id
            LEFT JOIN
                pedido_certo_ai.cliente ON cliente.cliente_id = linha.cliente_id
            WHERE 1 = 1
        ";

        if (request.NumeroLinha.HasValue) sql += " AND linha.linha = @linha";
        if (request.Categoria.HasValue) sql += " AND linha.categoria = @categoria";
        if (request.Genero.HasValue) sql += " AND linha.genero = @genero";
        if (request.FabricanteId.HasValue) sql += " AND linha.fabricante_id = @fabricante_id";

        var sort = string.IsNullOrWhiteSpace(request.Sort) ? "linha asc" : request.Sort.Trim().ToLowerInvariant();

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = request.NumeroLinha ?? 0;
            cmd.Parameters.Add("categoria", NpgsqlDbType.Smallint).Value = request.Categoria.HasValue ? (short)request.Categoria.Value : (short)0;
            cmd.Parameters.Add("genero", NpgsqlDbType.Smallint).Value = request.Genero.HasValue ? (short)request.Genero.Value : (short)0;
            cmd.Parameters.Add("fabricante_id", NpgsqlDbType.Uuid).Value = request.FabricanteId.HasValue ? request.FabricanteId.Value : Guid.Empty;
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 10;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                linhas.Add(new LinhaGetResponse
                {
                    LinhaId = reader.GetGuid("linha_id"),
                    NumeroLinha = reader.GetInt32("linha"),
                    NumeroInicial = reader.GetInt16(reader.GetOrdinal("numero_inicial")),
                    NumeroFinal = reader.GetInt16(reader.GetOrdinal("numero_final")),
                    Categoria = (CategoriaLinha)reader.GetInt16(reader.GetOrdinal("categoria")),
                    Genero = (GeneroLinha)reader.GetInt16(reader.GetOrdinal("genero")),
                    Exclusiva = reader.GetBoolean("exclusiva"),
                    ClienteId = reader.GetGuidNullable("cliente_id"),
                    Cliente = reader.GetString("cliente"),
                    ProcessoProdutivo = (ProcessoProdutivoLinha)reader.GetInt16(reader.GetOrdinal("processo_produtivo")),
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

    public async Task<Linha?> Obter(Guid linhaId)
    {
        const string sql = @"
            SELECT
                linha_id,
                linha,
                numero_inicial,
                numero_final,
                categoria,
                genero,
                exclusiva,
                linha.cliente_id,
                COALESCE(NULLIF(BTRIM(cliente.razao_social), ''), cliente.fantasia, '') AS cliente,
                processo_produtivo,
                linha.fabricante_id,
                COALESCE(NULLIF(BTRIM(fornecedor.razao_social), ''), fornecedor.fantasia, '') AS fabricante,
                rendimento
            FROM
                pedido_certo_ai.linha
            LEFT JOIN
                pedido_certo_ai.fornecedor ON fornecedor.fornecedor_id = linha.fabricante_id
            LEFT JOIN
                pedido_certo_ai.cliente ON cliente.cliente_id = linha.cliente_id
            WHERE
                linha.linha_id = @linha_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = linhaId;

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync()) return null;

            return new Linha
            {
                LinhaId = reader.GetGuid("linha_id"),
                NumeroLinha = reader.GetInt32("linha"),
                NumeroInicial = reader.GetInt16(reader.GetOrdinal("numero_inicial")),
                NumeroFinal = reader.GetInt16(reader.GetOrdinal("numero_final")),
                Categoria = (CategoriaLinha)reader.GetInt16(reader.GetOrdinal("categoria")),
                Genero = (GeneroLinha)reader.GetInt16(reader.GetOrdinal("genero")),
                Exclusiva = reader.GetBoolean("exclusiva"),
                ClienteId = reader.GetGuidNullable("cliente_id"),
                Cliente = reader.GetString("cliente"),
                ProcessoProdutivo = (ProcessoProdutivoLinha)reader.GetInt16(reader.GetOrdinal("processo_produtivo")),
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

    public async Task<int> Atualizar(Linha linha)
    {
        const string sql = @"
            UPDATE
                pedido_certo_ai.linha
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
                linha_id = @linha_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = linha.LinhaId;
            cmd.Parameters.Add("linha", NpgsqlDbType.Integer).Value = linha.NumeroLinha;
            cmd.Parameters.Add("numero_inicial", NpgsqlDbType.Smallint).Value = linha.NumeroInicial;
            cmd.Parameters.Add("numero_final", NpgsqlDbType.Smallint).Value = linha.NumeroFinal;
            cmd.Parameters.Add("categoria", NpgsqlDbType.Smallint).Value = (short)linha.Categoria;
            cmd.Parameters.Add("genero", NpgsqlDbType.Smallint).Value = (short)linha.Genero;
            cmd.Parameters.Add("exclusiva", NpgsqlDbType.Boolean).Value = linha.Exclusiva;
            cmd.Parameters.Add("cliente_id", NpgsqlDbType.Uuid).Value = linha.ClienteId.HasValue ? linha.ClienteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("processo_produtivo", NpgsqlDbType.Smallint).Value = (short)linha.ProcessoProdutivo;
            cmd.Parameters.Add("fabricante_id", NpgsqlDbType.Uuid).Value = linha.FabricanteId.HasValue ? linha.FabricanteId.Value : (object)DBNull.Value;
            cmd.Parameters.Add("rendimento", NpgsqlDbType.Numeric).Value = linha.Rendimento;

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
                pedido_certo_ai.linha
            WHERE
                linha = @linha
            AND
                (
                    (cliente_id IS NULL AND @cliente_id IS NULL)
                    OR cliente_id = @cliente_id
                )
            AND
                linha_id <> @ignoreId
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

    public async Task<bool> VerificarLinhaExiste(Guid linhaId)
    {
        const string sql = @"
            SELECT
                1
            FROM
                pedido_certo_ai.linha
            WHERE
                linha_id = @linha_id
            LIMIT 1;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("linha_id", NpgsqlDbType.Uuid).Value = linhaId;

            var result = await cmd.ExecuteScalarAsync();

            return result != null;
        }
        catch
        {
            throw;
        }
    }

}