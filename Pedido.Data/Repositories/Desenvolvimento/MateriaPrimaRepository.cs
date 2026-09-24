using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class MateriaPrimaRepository : BaseRepository, IMateriaPrimaRepository
{
    public MateriaPrimaRepository(IDbConnection connection) : base(connection) { }

    private static string ObterOrdenacao(string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort))
            return "descricao asc";

        var partes = sort.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var campo = partes.ElementAtOrDefault(0);
        var direcao = partes.ElementAtOrDefault(1) == "desc" ? "desc" : "asc";

        return campo switch
        {
            "estoque" => $"estoque {direcao}",
            "preco" => $"preco {direcao}",
            _ => $"descricao {direcao}"
        };
    }

    public async Task<Guid> Cadastrar(MateriaPrima materiaPrima)
    {
        const string sql = @"
            INSERT INTO pedido_certo_ai.materia_prima
            (
                materia_prima_id,
                descricao,
                unidade,
                estoque,
                preco
            )
            VALUES
            (
                @materia_prima_id,
                @descricao,
                @unidade,
                @estoque,
                @preco
            )
            RETURNING materia_prima_id;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("materia_prima_id", NpgsqlDbType.Uuid).Value = materiaPrima.MateriaPrimaId;
            cmd.Parameters.Add("descricao", NpgsqlDbType.Varchar).Value = materiaPrima.Descricao;
            cmd.Parameters.Add("unidade", NpgsqlDbType.Integer).Value = (int)materiaPrima.Unidade;
            cmd.Parameters.Add("estoque", NpgsqlDbType.Numeric).Value = materiaPrima.Estoque;
            cmd.Parameters.Add("preco", NpgsqlDbType.Numeric).Value = materiaPrima.Preco;

            var result = await cmd.ExecuteScalarAsync();

            return (Guid)result!;
        }
        catch
        {
            throw;
        }
    }

    public async Task<List<MateriaPrimaGetResponse>> Obter(MateriaPrimaGetRequest request)
    {
        var materiasPrimas = new List<MateriaPrimaGetResponse>();

        var sql = @"
            SELECT
                materia_prima_id,
                descricao,
                unidade,
                estoque,
                preco
            FROM
                pedido_certo_ai.materia_prima
            WHERE 1 = 1
        ";

        if (!string.IsNullOrWhiteSpace(request.Pesquisa))
            sql += " AND descricao ILIKE @pesquisa";

        var sort = ObterOrdenacao(request.Sort);

        sql += $" ORDER BY {sort} LIMIT @top OFFSET @skip";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("pesquisa", NpgsqlDbType.Varchar).Value = $"%{request.Pesquisa?.Trim()}%";
            cmd.Parameters.Add("top", NpgsqlDbType.Integer).Value = request.Top ?? 50;
            cmd.Parameters.Add("skip", NpgsqlDbType.Integer).Value = request.Skip ?? 0;

            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                materiasPrimas.Add(new MateriaPrimaGetResponse
                {
                    MateriaPrimaId = reader.GetGuid("materia_prima_id"),
                    Descricao = reader.GetString("descricao"),
                    Unidade = (UnidadeMateriaPrima)reader.GetInt32("unidade"),
                    Estoque = reader.GetDecimal("estoque"),
                    Preco = reader.GetDecimal("preco")
                });
            }

            return materiasPrimas;
        }
        catch
        {
            throw;
        }
    }
}