using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class RelatorioService : BaseService
{
    private readonly IRelatorioRepository _repository;
    private readonly IRelatorioPdfService _pdfService;

    public RelatorioService(
        IRelatorioRepository repository,
        IRelatorioPdfService pdfService)
    {
        _repository = repository;
        _pdfService = pdfService;
    }

    public async Task<List<RelatorioDiaResponse>> GerarRelatorio(RelatorioFiltroRequest filtro)
    {
        try
        {
            ValidarRelatorioPares(filtro);

            if (filtro.ClienteIds != null && filtro.ClienteIds.Count == 1)
            {
                filtro.Analitico = false;
            }

            return await _repository.ObterRelatorioPares(filtro);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao gerar relatório: {ex.Message}");
        }
    }

    public async Task<byte[]> GerarRelatorioPdf(RelatorioFiltroRequest filtro)
    {
        try
        {
            var filtroConsulta = new RelatorioFiltroRequest
            {
                DataInicial = filtro.DataInicial,
                DataFinal = filtro.DataFinal,
                ClienteIds = filtro.ClienteIds,
                Analitico = filtro.Analitico || filtro.IncluirGraficoBarras,
                IncluirGraficoBarras = filtro.IncluirGraficoBarras
            };
            var dados = await GerarRelatorio(filtroConsulta);

            if (dados.Count == 0 || dados.All(dia => dia.TotalPares <= 0))
            {
                AddError(nameof(RelatorioFiltroRequest), "Não existem dados para impressão do relatório.");
                throw new ValidationException(Errors);
            }

            return _pdfService.GerarRelatorio(filtro, dados);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao gerar PDF do relatório: {ex.Message}");
        }
    }

    private void ValidarRelatorioPares(RelatorioFiltroRequest filtro)
    {
        if (filtro == null)
        {
            AddError(nameof(RelatorioFiltroRequest), "Informe os dados do relatório.");
            throw new ValidationException(Errors);
        }

        if (!filtro.DataInicial.HasValue || !filtro.DataFinal.HasValue)
            AddError("Data", "Datas inicial e final são obrigatórias.");

        if (filtro.DataInicial.HasValue && filtro.DataFinal.HasValue && filtro.DataInicial.Value > filtro.DataFinal.Value)
            AddError("Data", "Data inicial não pode ser maior que a final.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}