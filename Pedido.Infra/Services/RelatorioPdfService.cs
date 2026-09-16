using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Pedido.Infra.Services;

public class RelatorioPdfService : IRelatorioPdfService
{
    public byte[] GerarRelatorio(
        RelatorioFiltroRequest filtro,
        List<RelatorioDiaResponse> dados)
    {
        ConfigurarLicenca();
        var logo = ObterLogo();

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(16);
                page.DefaultTextStyle(x => x.FontSize(7).FontColor(Colors.Black).FontFamily("Arial"));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(column =>
                    {
                        column.Item().Text("Relatório de Pedidos")
                            .FontSize(12)
                            .Bold();

                        column.Item().Text(text =>
                        {
                            text.Span("Período: ").Bold();
                            text.Span($"{FormatarData(filtro.DataInicial!.Value)} até {FormatarData(filtro.DataFinal!.Value)}");
                        });

                        column.Item().Text(text =>
                        {
                            text.Span("Tipo: ").Bold();
                            text.Span(filtro.Analitico ? "Analítico" : "Sintético");
                        });
                    });

                    row.ConstantItem(90).Height(45).AlignRight().Element(container =>
                    {
                        if (logo != null)
                            container.Image(logo).FitArea();
                    });
                });

                page.Content().PaddingVertical(8).Column(column =>
                {
                    column.Spacing(6);

                    column.Item().Element(content =>
                    {
                        if (filtro.Analitico)
                            MontarTabelaAnalitica(content, dados);
                        else
                            MontarTabelaSintetica(content, dados);
                    });

                    column.Item().AlignRight().Column(totalColumn =>
                    {
                        totalColumn.Item().Text($"Total geral: {dados.Sum(x => x.TotalPares)} pares")
                            .FontSize(9)
                            .Bold();
                        totalColumn.Item().Text($"Total bruto: {FormatarMoeda(dados.Sum(x => x.TotalBruto))}")
                            .FontSize(9)
                            .Bold();
                        totalColumn.Item().Text($"Total líquido: {FormatarMoeda(dados.Sum(x => x.TotalLiquido))}")
                            .FontSize(9)
                            .Bold();
                    });

                    if (filtro.IncluirGraficoBarras)
                    {
                        column.Item().PaddingTop(8).Element(content => MontarGraficoBarras(content, dados));
                    }
                });

                page.Footer().AlignRight().Text(text =>
                {
                    text.DefaultTextStyle(x => x.FontSize(7));
                    text.Span("Pag. ");
                    text.CurrentPageNumber();
                    text.Span("/");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    private static void MontarGraficoBarras(
        IContainer container,
        List<RelatorioDiaResponse> dados)
    {
        var clientes = dados
            .SelectMany(dia => ObterItensGrafico(dia))
            .Where(item => item.Pares > 0)
            .Select(item => item.ClienteNome)
            .Distinct()
            .ToList();

        if (clientes.Count == 0) return;

        var maiorValor = dados
            .SelectMany(dia => ObterItensGrafico(dia))
            .Select(item => item.Pares)
            .DefaultIfEmpty(0)
            .Max();

        if (maiorValor <= 0) return;

        var escalaMaxima = Math.Max(30, (int)Math.Ceiling(maiorValor / 30m) * 30);
        var marcasEscala = new[] { escalaMaxima, escalaMaxima / 2, escalaMaxima / 4, 0 };
        var cores = new[] { "#D4AF37", "#28A745", "#38BDF8", "#A855F7", "#F97316", "#EC4899" };

        container.Column(column =>
        {
            column.Spacing(5);
            column.Item().Text("Gráfico por Empresa").FontSize(9).Bold();

            column.Item().Height(120).Row(row =>
            {
                row.ConstantItem(22).Column(eixo =>
                {
                    eixo.Item().Height(96).Column(marcas =>
                    {
                        foreach (var marca in marcasEscala)
                        {
                            marcas.Item().Height(24).AlignRight().Text(marca.ToString()).FontSize(7);
                        }
                    });

                    eixo.Item().Height(12);
                });

                row.RelativeItem().Row(grafico =>
                {
                    foreach (var dia in dados)
                    {
                        var detalhes = ObterItensGrafico(dia);

                        grafico.RelativeItem().Column(diaColumn =>
                        {
                            diaColumn.Item().Height(96).AlignBottom().Row(barRow =>
                            {
                                barRow.Spacing(2);

                                foreach (var cliente in clientes)
                                {
                                    var detalhe = detalhes.FirstOrDefault(item => item.ClienteNome == cliente);
                                    var altura = detalhe == null ? 0 : Math.Max(1, 90f * detalhe.Pares / escalaMaxima);
                                    var cor = cores[clientes.IndexOf(cliente) % cores.Length];

                                    barRow.RelativeItem().Height(90).AlignBottom().Element(bar =>
                                    {
                                        if (altura > 0)
                                            bar.Height(altura).Background(cor);
                                    });
                                }
                            });

                            diaColumn.Item().AlignCenter().Text(FormatarData(dia.Data)).FontSize(6);
                        });
                    }
                });
            });

            column.Item().Column(legendColumn =>
            {
                legendColumn.Spacing(3);
                foreach (var linha in clientes.Select((nome, index) => new { nome, index }).Chunk(3))
                {
                    legendColumn.Item().Row(legend =>
                    {
                        legend.Spacing(6);

                        foreach (var cliente in linha)
                        {
                            var cor = cores[cliente.index % cores.Length];

                            legend.RelativeItem().Row(item =>
                            {
                                item.ConstantItem(6).Height(6).Background(cor);
                                item.RelativeItem().PaddingLeft(2).Text(cliente.nome).FontSize(6);
                            });
                        }
                    });
                }
            });
        });
    }

    private static List<RelatorioClienteDetalhe> ObterItensGrafico(RelatorioDiaResponse dia)
    {
        if (dia.Detalhes?.Count > 0) return dia.Detalhes;

        return new List<RelatorioClienteDetalhe>
        {
            new()
            {
                ClienteNome = "Total do dia",
                Pares = dia.TotalPares
            }
        };
    }

    private static void MontarTabelaSintetica(
        IContainer container,
        List<RelatorioDiaResponse> dados)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn();
                columns.RelativeColumn();
            });

            MontarHeader(table, "Data", "Total de Pares");

            foreach (var dia in dados)
            {
                MontarCelula(table, FormatarData(dia.Data));
                MontarCelula(table, $"{dia.TotalPares} pares", true);
            }
        });
    }

    private static void MontarTabelaAnalitica(
        IContainer container,
        List<RelatorioDiaResponse> dados)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(54);
                columns.RelativeColumn();
                columns.ConstantColumn(42);
                columns.ConstantColumn(45);
            });

            MontarHeader(table, "Data", "Cliente", "Pares", "Total Dia");

            foreach (var dia in dados)
            {
                var detalhes = dia.Detalhes ?? new List<RelatorioClienteDetalhe>();

                if (detalhes.Count == 0)
                {
                    MontarGrupoAnalitico(table, dia.Data, new List<RelatorioClienteDetalhe>
                    {
                        new()
                        {
                            ClienteNome = "-",
                            Pares = 0
                        }
                    }, dia.TotalPares);
                    continue;
                }

                MontarGrupoAnalitico(
                    table,
                    dia.Data,
                    detalhes.OrderByDescending(x => x.Pares).ToList(),
                    dia.TotalPares);
            }
        });
    }

    private static void MontarGrupoAnalitico(
        TableDescriptor table,
        string data,
        List<RelatorioClienteDetalhe> detalhes,
        int totalDia)
    {
        table.Cell()
            .BorderBottom(0.25f)
            .PaddingVertical(2)
            .PaddingHorizontal(3)
            .AlignMiddle()
            .AlignCenter()
            .Text(FormatarData(data))
            .Bold();

        table.Cell()
            .BorderBottom(0.25f)
            .PaddingVertical(2)
            .PaddingHorizontal(3)
            .Table(clienteTable =>
            {
                clienteTable.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                });

                foreach (var detalhe in detalhes)
                {
                    clienteTable.Cell()
                        .PaddingVertical(1)
                        .Text(detalhe.ClienteNome);
                }
            });

        table.Cell()
            .BorderBottom(0.25f)
            .PaddingVertical(2)
            .PaddingHorizontal(3)
            .Table(paresTable =>
            {
                paresTable.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                });

                foreach (var detalhe in detalhes)
                {
                    paresTable.Cell()
                        .PaddingVertical(1)
                        .Text($"{detalhe.Pares}");
                }
            });

        table.Cell()
            .BorderBottom(0.25f)
            .PaddingVertical(2)
            .PaddingHorizontal(3)
            .AlignMiddle()
            .AlignCenter()
            .Text($"{totalDia}")
            .Bold();
    }

    private static void MontarHeader(TableDescriptor table, params string[] colunas)
    {
        foreach (var coluna in colunas)
        {
            table.Cell()
                .BorderBottom(1)
                .PaddingVertical(3)
                .PaddingHorizontal(3)
                .Text(coluna)
                .Bold();
        }
    }

    private static void MontarCelula(
        TableDescriptor table,
        string valor,
        bool alignRight = false,
        bool alignCenter = false,
        bool desenharBorda = true)
    {
        var cell = table.Cell()
            .PaddingVertical(2)
            .PaddingHorizontal(3);

        if (desenharBorda)
            cell = cell.BorderBottom(0.25f);

        if (alignRight)
            cell.AlignRight().Text(valor);
        else if (alignCenter)
            cell.AlignCenter().Text(valor);
        else
            cell.Text(valor);
    }

    private static void ConfigurarLicenca()
    {
        var license = Environment
            .GetEnvironmentVariable("QUESTPDF_LICENSE")?
            .Trim()
            .ToLowerInvariant();

        QuestPDF.Settings.License = license switch
        {
            "professional" => LicenseType.Professional,
            "enterprise" => LicenseType.Enterprise,
            _ => LicenseType.Community
        };
    }

    private static byte[]? ObterLogo()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Assets", "logo.png");

        return File.Exists(path)
            ? File.ReadAllBytes(path)
            : null;
    }

    private static string FormatarData(DateTime data)
    {
        return data.ToString("dd/MM/yyyy");
    }

    private static string FormatarData(string data)
    {
        return DateTime.TryParse(data, out var dataFormatada)
            ? FormatarData(dataFormatada)
            : data;
    }

    private static string FormatarMoeda(decimal valor)
    {
        return valor.ToString("C", new System.Globalization.CultureInfo("pt-BR"));
    }
}
