using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using System.Data;

namespace Pedido.Data.Repositories;

public class RelatorioRepository : BaseRepository, IRelatorioRepository
{
    public RelatorioRepository(IDbConnection connection) : base(connection) { }

    public async Task<List<RelatorioDiaResponse>> ObterRelatorioPares(RelatorioFiltroRequest filtro)
    {
        string sql = @"
            SELECT 
                agenda.data AS data_dia,
                c.cliente_id,
                c.razao_social AS cliente_nome,
                SUM(programacao.quantidade) AS total_pares,
                SUM(
                    CASE
                        WHEN COALESCE(p.total_pares, 0) = 0 THEN 0
                        ELSE p.total_bruto * programacao.quantidade / NULLIF(p.total_pares, 0)
                    END
                ) AS total_bruto,
                SUM(
                    CASE
                        WHEN COALESCE(p.total_pares, 0) = 0 THEN 0
                        ELSE p.total_liquido * programacao.quantidade / NULLIF(p.total_pares, 0)
                    END
                ) AS total_liquido
            FROM
                pedido_certo_ai.programacao
            INNER JOIN
                pedido_certo_ai.agenda ON agenda.agenda_id = programacao.agenda_id
            INNER JOIN
                pedido_certo_ai.pedido p ON p.pedido_id = programacao.pedido_id
            LEFT JOIN
                pedido_certo_ai.cliente c ON p.cliente_id = c.cliente_id
            WHERE
                agenda.data >= @data_inicial
                AND agenda.data <= @data_final
        ";

        if (filtro.ClienteIds != null && filtro.ClienteIds.Any())
        {
            sql += " AND p.cliente_id = ANY(@cliente_ids) ";
        }

        sql += @"
            GROUP BY agenda.data, c.cliente_id, c.razao_social
            ORDER BY agenda.data ASC;
        ";

        try
        {
            await EnsureOpenAsync();
            await using var cmd = new NpgsqlCommand(sql, Connection);

            cmd.Parameters.Add("data_inicial", NpgsqlDbType.Date).Value = filtro.DataInicial!.Value.Date;
            cmd.Parameters.Add("data_final", NpgsqlDbType.Date).Value = filtro.DataFinal!.Value.Date;

            if (filtro.ClienteIds != null && filtro.ClienteIds.Any())
            {
                cmd.Parameters.Add("cliente_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid).Value = filtro.ClienteIds.ToArray();
            }

            await using var reader = await cmd.ExecuteReaderAsync();

            var dictDias = new Dictionary<string, RelatorioDiaResponse>();

            while (await reader.ReadAsync())
            {
                var dataDb = reader.GetDateTime("data_dia");
                var dataFormatada = dataDb.ToString("yyyy-MM-dd");
                var pares = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("total_pares")));
                var totalBruto = reader.GetDecimalNullable("total_bruto") ?? 0;
                var totalLiquido = reader.GetDecimalNullable("total_liquido") ?? 0;

                if (!dictDias.ContainsKey(dataFormatada))
                {
                    dictDias[dataFormatada] = new RelatorioDiaResponse
                    {
                        Data = dataFormatada,
                        TotalPares = 0,
                        Detalhes = filtro.Analitico ? new List<RelatorioClienteDetalhe>() : null
                    };
                }

                dictDias[dataFormatada].TotalPares += pares;
                dictDias[dataFormatada].TotalBruto += totalBruto;
                dictDias[dataFormatada].TotalLiquido += totalLiquido;

                if (filtro.Analitico)
                {
                    dictDias[dataFormatada].Detalhes!.Add(new RelatorioClienteDetalhe
                    {
                        ClienteId = reader.GetGuidNullable("cliente_id") ?? Guid.Empty,
                        ClienteNome = reader.GetStringNullable("cliente_nome") ?? "Não informado",
                        Pares = pares,
                        TotalBruto = totalBruto,
                        TotalLiquido = totalLiquido
                    });
                }
            }

            return dictDias.Values.ToList();
        }
        catch
        {
            throw;
        }
    }
}
