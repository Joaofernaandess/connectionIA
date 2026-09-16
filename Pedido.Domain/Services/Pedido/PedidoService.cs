using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;
using PedidoModel = Pedido.Domain.Models.Pedido;

namespace Pedido.Domain.Services;

public class PedidoService : BaseService
{
    private readonly IPedidoRepository _pedidoRepository;
    private readonly IPedidoAvaliacaoGestorRepository _pedidoAvaliacaoGestorRepository;
    private readonly IPedidoItemRepository _pedidoItemRepository;
    private readonly ClienteService _clienteService;
    private readonly FornecedorService _fornecedorService;
    private readonly IPedidoAtualizacaoNotifier _pedidoAtualizacaoNotifier;
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPedidoNotificationService _notificationService;

    public PedidoService(
        IPedidoRepository pedidoRepository,
        IPedidoAvaliacaoGestorRepository pedidoAvaliacaoGestorRepository,
        IPedidoItemRepository pedidoItemRepository,
        ClienteService clienteService,
        FornecedorService fornecedorService,
        IPedidoAtualizacaoNotifier pedidoAtualizacaoNotifier,
        IUsuarioRepository usuarioRepository,
        IPedidoNotificationService notificationService)
    {
        _pedidoRepository = pedidoRepository;
        _pedidoAvaliacaoGestorRepository = pedidoAvaliacaoGestorRepository;
        _pedidoItemRepository = pedidoItemRepository;
        _clienteService = clienteService;
        _fornecedorService = fornecedorService;
        _pedidoAtualizacaoNotifier = pedidoAtualizacaoNotifier;
        _usuarioRepository = usuarioRepository;
        _notificationService = notificationService;
    }

    public async Task<Guid> Cadastrar(PedidoPostRequest pedidoRequest, Guid usuarioId)
    {
        try
        {
            await ValidarPedido(pedidoRequest);

            var pedido = new PedidoModel
            {
                PedidoId = Guid.NewGuid(),
                PedidoLinkId = pedidoRequest.PedidoLinkId,
                UsuarioId = usuarioId,
                Status = PedidoStatus.AguardandoAnaliseIA
            };

            var pedidoId = await _pedidoRepository.CadastrarPedido(pedido);

            await NotificarPedidoAtualizado(pedidoId, pedido.Status);

            return pedidoId;
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
            throw new Exception($"Erro ao cadastrar pedido: {ex.Message}");
        }
    }

    public async Task<List<PedidoGetResponse>> Obter(PedidoGetRequest request)
    {
        try
        {
            return await _pedidoRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter pedidos: {ex.Message}");
        }
    }

    public async Task<PedidoGetByIdResponse> Obter(Guid pedidoId)
    {
        try
        {
            var pedido = await _pedidoRepository.Obter(pedidoId);

            if (pedido == null) throw new NotFoundException("Pedido não encontrado com o ID informado.");

            var pedidoResponse = PedidoMapper.MontarPedidoGetByIdResponse(pedido);
            pedidoResponse.Itens = await _pedidoItemRepository.Obter(pedidoId);
            pedidoResponse.AnaliseIA = await _pedidoAvaliacaoGestorRepository.Obter(pedidoId);

            return pedidoResponse;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter pedido por ID: {ex.Message}");
        }
    }

    public async Task Atualizar(
        Guid pedidoId,
        PedidoPutRequest pedidoRequest,
        PedidoStatus? status = null)
    {
        try
        {
            if (status == null)
                await ValidarPedidoOcr(pedidoRequest);

            var pedidoAtual = await _pedidoRepository.Obter(pedidoId);

            if (pedidoAtual == null)
                throw new NotFoundException("Pedido não encontrado com o ID informado.");

            if (status == null && PedidoMapper.ObterStatusPedido(pedidoAtual.Status) != PedidoStatus.AguardandoAnaliseGestor)
            {
                AddError(nameof(pedidoAtual.Status), "Pedido permite edição apenas quando estiver aguardando análise do gestor.");
                throw new ValidationException(Errors);
            }

            var pedido = new PedidoModel
            {
                PedidoId = pedidoId,
                ClienteId = pedidoRequest.ClienteId,
                FornecedorId = pedidoRequest.FornecedorId,
                NumeroPedido = pedidoRequest.NumeroPedido,
                DataEmissao = pedidoRequest.DataEmissao,
                DataFaturamento = pedidoRequest.DataFaturamento,
                CondicaoPagamento = pedidoRequest.CondicaoPagamento,
                Representante = pedidoRequest.Representante,
                PercentualDesconto = pedidoRequest.PercentualDesconto,
                TotalPares = pedidoRequest.TotalPares,
                TotalBruto = pedidoRequest.TotalBruto,
                ValorDesconto = pedidoRequest.ValorDesconto,
                TotalLiquido = pedidoRequest.TotalLiquido,
                Observacoes = PedidoObservacaoNormalizer.Normalizar(pedidoRequest.Observacoes),
                Status = status ?? PedidoMapper.ObterStatusPedido(pedidoAtual.Status)
            };

            var affected = await _pedidoRepository.Atualizar(pedido);

            if (affected <= 0) throw new NotFoundException("Pedido não encontrado com o ID informado.");

            await NotificarPedidoAtualizado(pedidoId, pedido.Status);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao atualizar pedido: {ex.Message}");
        }
    }

    public List<PedidoAvaliacaoNotaGetResponse> ObterNotasAvaliacaoGestor()
    {
        try
        {
            return Enum.GetValues<PedidoAvaliacaoNotaEnum>()
                .Select(nota => new PedidoAvaliacaoNotaGetResponse
                {
                    Value = (int)nota,
                    Label = nota.ToString()
                })
                .OrderBy(nota => nota.Value)
                .ToList();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter notas de avaliação do gestor: {ex.Message}");
        }
    }

    public async Task<Guid> SalvarAvaliacaoGestor(Guid pedidoId, PedidoAvaliacaoGestorPostRequest avaliacaoRequest)
    {
        try
        {
            ValidarAvaliacaoGestor(avaliacaoRequest);

            var pedido = await _pedidoRepository.Obter(pedidoId);

            if (pedido == null)
                throw new NotFoundException("Pedido não encontrado com o ID informado.");

            if (pedido.Status != PedidoStatus.AguardandoAnaliseGestor.ToString())
            {
                AddError(nameof(pedido.Status), "Pedido não está aguardando análise do gestor.");
                throw new ValidationException(Errors);
            }

            var motivo = NormalizarMotivoAvaliacaoGestor(avaliacaoRequest.Motivo);

            var avaliacao = new PedidoAvaliacaoGestor
            {
                PedidoAvaliacaoGestorId = Guid.NewGuid(),
                PedidoId = pedidoId,
                Aprovado = avaliacaoRequest.Aprovado,
                Nota = avaliacaoRequest.Nota,
                Motivo = motivo,
                Prompt = motivo,
                SolicitaRevisao = avaliacaoRequest.SolicitaRevisao,
                DataAvaliacao = DateTimeHelper.SaoPaulo()
            };

            await _pedidoAvaliacaoGestorRepository.Salvar(avaliacao);

            if (avaliacao.Aprovado)
            {
                var status = PedidoStatus.PedidoProcessado;
                var affected = await _pedidoRepository.AtualizarStatus(pedidoId, status);

                if (affected <= 0)
                    throw new NotFoundException("Pedido não encontrado com o ID informado.");

                await NotificarPedidoAtualizado(pedidoId, status);
            }
            else
            {
                var status = PedidoStatus.ReprovadoPeloGestor;
                var affected = await _pedidoRepository.AtualizarStatus(pedidoId, status);

                if (affected <= 0)
                    throw new NotFoundException("Pedido não encontrado com o ID informado.");

                await NotificarPedidoAtualizado(pedidoId, status);
            }

            if (!avaliacao.Aprovado && avaliacao.SolicitaRevisao)
            {
                await NotificarSolicitacaoRevisaoPedido(pedido);
            }

            return avaliacao.PedidoAvaliacaoGestorId;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao salvar avaliação do gestor do pedido: {ex.Message}");
        }
    }

    public async Task AtualizarPromptAvaliacaoGestor(
        Guid pedidoId,
        Guid pedidoAvaliacaoGestorId,
        PedidoAvaliacaoGestorPromptPutRequest request)
    {
        try
        {
            var prompt = NormalizarPromptAvaliacaoGestor(request.Prompt);

            var affected = await _pedidoAvaliacaoGestorRepository.AtualizarPrompt(
                pedidoId,
                pedidoAvaliacaoGestorId,
                prompt);

            if (affected <= 0)
                throw new NotFoundException("Avaliação do pedido não encontrada com os parâmetros informados.");
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao atualizar prompt da avaliação do gestor: {ex.Message}");
        }
    }

    private async Task NotificarPedidoAtualizado(Guid pedidoId, PedidoStatus status)
    {
        await _pedidoAtualizacaoNotifier.NotificarPedidoAtualizado(pedidoId, status);
    }

    private async Task NotificarSolicitacaoRevisaoPedido(PedidoGetResponse pedido)
    {
        var admins = await _usuarioRepository.ObterAdmins();

        if (!admins.Any())
            return;

        var numeroPedido = string.IsNullOrWhiteSpace(pedido.NumeroPedido)
            ? pedido.PedidoId.ToString()
            : pedido.NumeroPedido;

        foreach (var admin in admins.Where(admin => !string.IsNullOrWhiteSpace(admin.Username)))
        {
            await _notificationService.EnviarSolicitacaoRevisaoPedidoAsync(
                admin.Username,
                numeroPedido);
        }
    }

    private async Task ValidarPedido(PedidoPostRequest pedido)
    {
        await Task.CompletedTask;

        if (string.IsNullOrWhiteSpace(pedido.PedidoLinkId))
            AddError(nameof(pedido.PedidoLinkId), "Informe o link do pedido.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarPedidoOcr(PedidoPutRequest pedido)
    {
        if (!pedido.ClienteId.HasValue)
        {
            AddError(nameof(pedido.ClienteId), "Informe o cliente do pedido.");
        }
        else
        {
            var clienteExiste = await _clienteService.ClienteExiste(pedido.ClienteId.Value);

            if (!clienteExiste)
                AddError(nameof(pedido.ClienteId), "Cliente não encontrado com o ID informado.");
        }

        if (string.IsNullOrWhiteSpace(pedido.NumeroPedido))
            AddError(nameof(pedido.NumeroPedido), "Informe o número do pedido.");

        if (pedido.Itens == null || pedido.Itens.Count == 0)
            AddError(nameof(pedido.Itens), "O pedido deve ter pelo menos um item.");

        ValidarItensPedidoOcr(pedido.Itens);

        var totalParesItens = pedido.Itens?.Sum(item => item.Grades?.Sum(grade => grade.Quantidade) ?? 0) ?? 0;

        if (totalParesItens <= 0)
            AddError(nameof(pedido.TotalPares), "A quantidade total do pedido deve ser maior que zero.");

        if (!pedido.FornecedorId.HasValue)
        {
            AddError(nameof(pedido.FornecedorId), "Informe o fornecedor do pedido.");
        }
        else
        {
            var fornecedorExiste = await _fornecedorService.FornecedorExiste(pedido.FornecedorId.Value);

            if (!fornecedorExiste)
                AddError(nameof(pedido.FornecedorId), "Fornecedor não encontrado com o ID informado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarItensPedidoOcr(List<PedidoItemPostRequest>? itens)
    {
        if (itens == null || itens.Count == 0)
            return;

        var mensagens = new List<string>();

        for (var index = 0; index < itens.Count; index++)
        {
            var item = itens[index];
            var prefixoLinha = $"Linha {index + 1:00}:";

            if (string.IsNullOrWhiteSpace(item.Referencia))
                mensagens.Add($"{prefixoLinha} informe a referência");

            if (string.IsNullOrWhiteSpace(item.MaterialCor))
                mensagens.Add($"{prefixoLinha} informe o material/cor");

            if (item.Grades == null || !item.Grades.Any())
                mensagens.Add($"{prefixoLinha} informe pelo menos uma grade");
        }

        if (mensagens.Any())
            AddError(nameof(PedidoPutRequest.Itens), string.Join(Environment.NewLine, mensagens) + Environment.NewLine);
    }

    private void ValidarAvaliacaoGestor(PedidoAvaliacaoGestorPostRequest avaliacao)
    {
        if (!Enum.IsDefined(typeof(PedidoAvaliacaoNotaEnum), avaliacao.Nota))
            AddError(nameof(avaliacao.Nota), "Informe uma nota válida.");

        if (!avaliacao.Aprovado && string.IsNullOrWhiteSpace(avaliacao.Motivo))
            AddError(nameof(avaliacao.Motivo), "Informe a justificativa da reprovação.");

        if (!string.IsNullOrWhiteSpace(avaliacao.Motivo) && avaliacao.Motivo.Trim().Length > 1000)
            AddError(nameof(avaliacao.Motivo), "Informe menos de 1000 caracteres");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private static string NormalizarMotivoAvaliacaoGestor(string motivo)
    {
        return string.IsNullOrWhiteSpace(motivo) ? string.Empty : motivo.Trim();
    }

    private string NormalizarPromptAvaliacaoGestor(string prompt)
    {
        if (!string.IsNullOrWhiteSpace(prompt) && prompt.Trim().Length > 1000)
            AddError(nameof(PedidoAvaliacaoGestorPromptPutRequest.Prompt), "Informe menos de 1000 caracteres");

        if (Errors.Any())
            throw new ValidationException(Errors);

        return string.IsNullOrWhiteSpace(prompt) ? string.Empty : prompt.Trim();
    }

}