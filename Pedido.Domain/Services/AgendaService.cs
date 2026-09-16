using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class AgendaService : BaseService
{
    private readonly IAgendaRepository _agendaRepository;

    public AgendaService(IAgendaRepository agendaRepository)
    {
        _agendaRepository = agendaRepository;
    }

    public async Task CriarAgenda(AgendaPostRequest request)
    {
        ValidarAgenda(request);

        try
        {
            var agendaItems = request.AgendaItems
                .Select(data => new AgendaItem
                {
                    Data = DateTime.SpecifyKind(data.Date, DateTimeKind.Unspecified),
                    Util = request.Util,
                    Motivo = request.Motivo
                })
                .GroupBy(agendaItem => agendaItem.Data.Date)
                .Select(grupo => grupo.Last())
                .ToList();

            await _agendaRepository.Cadastrar(agendaItems);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao criar agenda: {ex.Message}");
        }
    }

    public async Task<List<AgendaResponse>> ObterAgenda()
    {
        try
        {
            return await _agendaRepository.ObterAgenda();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter agenda: {ex.Message}");
        }
    }

    public async Task AtualizarAgenda(Guid agendaId, AgendaPutRequest request)
    {
        ValidarAgenda(request);

        try
        {
            var agendaAtual = await _agendaRepository.Obter(agendaId);

            if (!agendaAtual.Any())
                throw new NotFoundException("Agenda não encontrada com o ID informado.");

            var dataSemFuso = DateTime.SpecifyKind(request.Data!.Value.Date, DateTimeKind.Unspecified);

            var affected = await _agendaRepository.Atualizar(agendaId, dataSemFuso, request.Util, request.Motivo);

            if (affected <= 0)
                throw new NotFoundException("Agenda não encontrada com o ID informado.");
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao atualizar agenda: {ex.Message}");
        }
    }

    private void ValidarAgenda(AgendaPostRequest request)
    {
        if (request == null)
        {
            AddError(nameof(AgendaPostRequest), "Informe os dados da agenda.");
            throw new ValidationException(Errors);
        }

        var agendaItems = request.AgendaItems ?? [];

        if (!agendaItems.Any())
            AddError(nameof(request.AgendaItems), "Informe ao menos um dia para a agenda.");

        if (!string.IsNullOrWhiteSpace(request.Motivo) && request.Motivo.Trim().Length > 100)
            AddError(nameof(request.Motivo), "Informe menos de 100 caracteres");

        foreach (var data in agendaItems)
        {
            if (data == DateTime.MinValue)
                AddError(nameof(request.AgendaItems), "Informe uma data válida para a agenda.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarAgenda(AgendaItem request)
    {
        ValidarCamposAgenda(request);

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarCamposAgenda(AgendaItem request)
    {
        if (request.Data == DateTime.MinValue)
            AddError(nameof(request.Data), "Informe uma data válida para a agenda.");

        if (!string.IsNullOrWhiteSpace(request.Motivo) && request.Motivo.Trim().Length > 100)
            AddError(nameof(request.Motivo), "Informe menos de 100 caracteres");
    }

    private void ValidarAgenda(AgendaPutRequest request)
    {
        if (request == null)
        {
            AddError(nameof(AgendaPutRequest), "Informe os dados da agenda.");
            throw new ValidationException(Errors);
        }

        if (!request.Data.HasValue)
            AddError(nameof(request.Data), "Informe uma data válida para a agenda.");

        if (Errors.Any())
            throw new ValidationException(Errors);

        ValidarAgenda(new AgendaItem
        {
            Data = request.Data!.Value,
            Util = request.Util,
            Motivo = request.Motivo
        });
    }

}