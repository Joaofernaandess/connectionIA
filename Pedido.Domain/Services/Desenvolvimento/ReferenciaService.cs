using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ReferenciaService : BaseService
{
    private readonly IReferenciaRepository _referenciaRepository;
    private readonly ILinhaRepository _linhaRepository;
    private readonly ICorRepository _corRepository;
    private readonly IAuditoriaService _auditoriaService;

    public ReferenciaService(
        IReferenciaRepository referenciaRepository,
        ILinhaRepository linhaRepository,
        ICorRepository corRepository,
        IAuditoriaService auditoriaService)
    {
        _referenciaRepository = referenciaRepository;
        _linhaRepository = linhaRepository;
        _corRepository = corRepository;
        _auditoriaService = auditoriaService;
    }

    public async Task<ReferenciaPostResponse> Cadastrar(ReferenciaPostRequest request, AuditoriaUsuario usuario)
    {
        try
        {
            await ValidarLinha(request.LinhaId, false);
            await ValidarCor(request.CorId, false, false);
            ValidarSigla(request.Sigla);

            if (Errors.Any())
                throw new ValidationException(Errors);

            var proximaReferencia = await _referenciaRepository.ObterProxima(request.LinhaId);

            if (proximaReferencia == null)
                throw new NotFoundException("Linha não encontrada com o ID informado.");

            var referenciaExiste = await _referenciaRepository.VerificarReferenciaExiste(request.LinhaId, proximaReferencia.ProximaReferencia);

            if (referenciaExiste)
                AddError(nameof(Referencia.NumeroReferencia), "Referência já existente para esta linha.");

            if (Errors.Any())
                throw new ValidationException(Errors);

            var sigla = request.Sigla.Trim().ToUpperInvariant();
            var codigoReferencia = $"{proximaReferencia.CodigoReferencia}{sigla}";

            var referencia = new Referencia
            {
                ReferenciaId = Guid.NewGuid(),
                LinhaId = request.LinhaId,
                NumeroReferencia = proximaReferencia.ProximaReferencia,
                CodigoReferencia = codigoReferencia,
                Sigla = sigla,
                Observacao = request.Observacao?.Trim()
            };

            var referenciaId = await _referenciaRepository.Cadastrar(referencia);
            ReferenciaCorResponse? referenciaCor = null;

            if (request.CorId.HasValue)
                referenciaCor = await CadastrarCorInterno(referenciaId, codigoReferencia, request.CorId.Value);

            _auditoriaService.RegistrarCadastro(usuario, "Referência", referenciaId, referencia);

            return new ReferenciaPostResponse
            {
                ReferenciaId = referenciaId,
                LinhaId = request.LinhaId,
                CorId = referenciaCor?.CorId,
                NumeroLinha = proximaReferencia.NumeroLinha,
                NumeroReferencia = proximaReferencia.ProximaReferencia,
                CodigoReferencia = codigoReferencia,
                CodigoReferenciaCor = referenciaCor?.CodigoReferenciaCor ?? string.Empty,
                Sigla = sigla,
                CorDescricao = referenciaCor?.CorDescricao ?? string.Empty,
                CorCodigo = referenciaCor?.CorCodigo ?? string.Empty,
                Observacao = referencia.Observacao,
                Cores = referenciaCor == null ? [] : [referenciaCor]
            };
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
            throw new Exception($"Erro ao cadastrar referência: {ex.Message}");
        }
    }

    public async Task<List<ReferenciaGetResponse>> Obter(ReferenciaGetRequest request)
    {
        try
        {
            var referencias = await _referenciaRepository.Obter(request);

            foreach (var referencia in referencias)
            {
                referencia.Cores = await _referenciaRepository.ObterCores(referencia.ReferenciaId);
            }

            return referencias;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter referências: {ex.Message}");
        }
    }

    public async Task<Referencia> Obter(Guid referenciaId)
    {
        try
        {
            if (referenciaId == Guid.Empty)
                throw new NotFoundException("Referência não encontrada com o ID informado.");

            var referencia = await _referenciaRepository.Obter(referenciaId);

            if (referencia == null)
                throw new NotFoundException("Referência não encontrada com o ID informado.");

            referencia.Cores = await _referenciaRepository.ObterCores(referenciaId);

            return referencia;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter referência por ID: {ex.Message}");
        }
    }

    public async Task<ReferenciaProximaResponse> ObterProxima(Guid linhaId)
    {
        try
        {
            await ValidarLinha(linhaId);

            var proximaReferencia = await _referenciaRepository.ObterProxima(linhaId);

            if (proximaReferencia == null)
                throw new NotFoundException("Linha não encontrada com o ID informado.");

            return proximaReferencia;
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
            throw new Exception($"Erro ao obter próxima referência: {ex.Message}");
        }
    }

    public async Task ValidarEntrada(ReferenciaEntradaRequest request)
    {
        try
        {
            await ValidarLinha(request.LinhaId, false);

            if (!request.PossuiDesenho)
                AddError(nameof(request.PossuiDesenho), "Informe o desenho da referência.");

            if (Errors.Any())
                throw new ValidationException(Errors);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao validar entrada da referência: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid referenciaId, ReferenciaPutRequest request, AuditoriaUsuario usuario)
    {
        try
        {
            if (referenciaId == Guid.Empty)
                AddError(nameof(Referencia.ReferenciaId), "Informe a referência.");

            var referenciaAtual = referenciaId == Guid.Empty ? null : await _referenciaRepository.Obter(referenciaId);

            if (referenciaAtual == null)
                throw new NotFoundException("Referência não encontrada com o ID informado.");

            await ValidarLinha(request.LinhaId, false);
            await ValidarCor(request.CorId, false, false);
            ValidarSigla(request.Sigla);

            if (Errors.Any())
                throw new ValidationException(Errors);

            var sigla = request.Sigla.Trim().ToUpperInvariant();
            var codigoReferencia = $"{referenciaAtual!.NumeroReferencia}{sigla}";

            var referencia = new Referencia
            {
                ReferenciaId = referenciaId,
                LinhaId = request.LinhaId,
                NumeroReferencia = referenciaAtual.NumeroReferencia,
                CodigoReferencia = codigoReferencia,
                Sigla = sigla,
                Observacao = request.Observacao?.Trim()
            };

            var affected = await _referenciaRepository.Atualizar(referencia);

            if (affected <= 0) throw new NotFoundException("Referência não encontrada com o ID informado.");

            if (request.CorId.HasValue)
            {
                var corJaVinculada = await _referenciaRepository.VerificarReferenciaCorExiste(referenciaId, request.CorId.Value);
                var referenciaCor = await CadastrarCorInterno(referenciaId, codigoReferencia, request.CorId.Value, true);

                if (!corJaVinculada)
                    RegistrarCorAdicionada(usuario, referenciaId, codigoReferencia, referenciaCor);
            }

            _auditoriaService.RegistrarAlteracao(usuario, "Referência", referenciaId, referenciaAtual, referencia);
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
            throw new Exception($"Erro ao atualizar referência: {ex.Message}");
        }
    }

    public async Task<ReferenciaCorResponse> CadastrarCor(Guid referenciaId, ReferenciaCorPostRequest request, AuditoriaUsuario usuario)
    {
        try
        {
            if (referenciaId == Guid.Empty)
                throw new NotFoundException("Referência não encontrada com o ID informado.");

            var referencia = await _referenciaRepository.Obter(referenciaId);

            if (referencia == null)
                throw new NotFoundException("Referência não encontrada com o ID informado.");

            await ValidarCor(request.CorId, false);

            if (Errors.Any())
                throw new ValidationException(Errors);

            var result = await CadastrarCorInterno(referenciaId, referencia.CodigoReferencia, request.CorId);

            RegistrarCorAdicionada(usuario, referenciaId, referencia.CodigoReferencia, result);

            return result;
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
            throw new Exception($"Erro ao cadastrar cor da referência: {ex.Message}");
        }
    }

    private async Task<ReferenciaCorResponse> CadastrarCorInterno(Guid referenciaId, string codigoReferencia, Guid corId, bool ignorarDuplicada = false)
    {
        var referenciaCorExiste = await _referenciaRepository.VerificarReferenciaCorExiste(referenciaId, corId);

        if (referenciaCorExiste)
        {
            if (ignorarDuplicada)
                return (await _referenciaRepository.ObterCores(referenciaId)).First(cor => cor.CorId == corId);

            AddError(nameof(ReferenciaCor.CorId), "Esta cor já está cadastrada para esta referência.");
            throw new ValidationException(Errors);
        }

        var cor = await _corRepository.Obter(corId);

        if (cor == null)
            throw new NotFoundException("Cor não encontrada com o ID informado.");

        var referenciaCor = new ReferenciaCor
        {
            ReferenciaId = referenciaId,
            CorId = corId
        };

        var result = await _referenciaRepository.CadastrarCor(referenciaCor);
        result.CorDescricao = cor.CorDescricao;
        result.CorCodigo = cor.CorCodigo;
        result.CodigoReferenciaCor = $"{codigoReferencia}-{cor.CorCodigo}";

        return result;
    }

    private void RegistrarCorAdicionada(
        AuditoriaUsuario usuario,
        Guid referenciaId,
        string codigoReferencia,
        ReferenciaCorResponse referenciaCor)
    {
        _auditoriaService.RegistrarEvento(
            usuario,
            "Alteração",
            "Referência",
            referenciaId,
            $"Adicionou a cor {referenciaCor.CorCodigo} {referenciaCor.CorDescricao} à referência {codigoReferencia}.");
    }

    private async Task ValidarLinha(Guid linhaId, bool lancarErro = true)
    {
        if (linhaId == Guid.Empty)
            AddError(nameof(Referencia.LinhaId), "Informe a linha.");

        if (linhaId != Guid.Empty)
        {
            var linhaExiste = await _linhaRepository.VerificarLinhaExiste(linhaId);

            if (!linhaExiste)
                AddError(nameof(Referencia.LinhaId), "Linha não encontrada com o ID informado.");
        }

        if (lancarErro && Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarCor(Guid? corId, bool lancarErro = true, bool obrigatoria = true)
    {
        if (obrigatoria && !corId.HasValue)
            AddError(nameof(ReferenciaCor.CorId), "Informe a cor.");

        if (corId.HasValue && corId.Value == Guid.Empty)
            AddError(nameof(ReferenciaCor.CorId), "Informe uma cor válida.");

        if (corId.HasValue && corId.Value != Guid.Empty)
        {
            var corExiste = await _corRepository.VerificarCorExiste(corId.Value);

            if (!corExiste)
                AddError(nameof(ReferenciaCor.CorId), "Cor não encontrada com o ID informado.");
        }

        if (lancarErro && Errors.Any())
            throw new ValidationException(Errors);
    }

    private void ValidarSigla(string sigla)
    {
        if (string.IsNullOrWhiteSpace(sigla))
            AddError(nameof(Referencia.Sigla), "Informe a sigla.");
    }
}