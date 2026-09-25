using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class LinhaService : BaseService
{
    private readonly ILinhaRepository _linhaRepository;
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IClienteRepository _clienteRepository;
    private readonly IAuditoriaService _auditoriaService;

    public LinhaService(
        ILinhaRepository linhaRepository,
        IFornecedorRepository fornecedorRepository,
        IClienteRepository clienteRepository,
        IAuditoriaService auditoriaService)
    {
        _linhaRepository = linhaRepository;
        _fornecedorRepository = fornecedorRepository;
        _clienteRepository = clienteRepository;
        _auditoriaService = auditoriaService;
    }

    public async Task<Guid> Cadastrar(LinhaPostRequest request, AuditoriaUsuario usuario)
    {
        try
        {
            await ValidarCampos(request.NumeroLinha, request.NumeroInicial, request.NumeroFinal, request.Categoria, request.Genero, request.Exclusiva, request.ClienteId, request.ProcessoProdutivo, request.FabricanteId, Guid.Empty);

            var linha = new Linha
            {
                LinhaId = Guid.NewGuid(),
                NumeroLinha = request.NumeroLinha,
                NumeroInicial = request.NumeroInicial!.Value,
                NumeroFinal = request.NumeroFinal!.Value,
                Categoria = request.Categoria,
                Genero = request.Genero,
                Exclusiva = request.Exclusiva,
                ClienteId = request.ClienteId,
                ProcessoProdutivo = request.ProcessoProdutivo,
                FabricanteId = request.FabricanteId,
                Rendimento = request.Rendimento
            };

            var linhaId = await _linhaRepository.Cadastrar(linha);

            _auditoriaService.RegistrarCadastro(usuario, "Linha", linhaId, linha);

            return linhaId;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar linha: {ex.Message}");
        }
    }

    public async Task<List<LinhaGetResponse>> Obter(LinhaGetRequest request)
    {
        try
        {
            return await _linhaRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter linhas: {ex.Message}");
        }
    }

    public async Task<Linha> Obter(Guid linhaId)
    {
        try
        {
            var linha = await _linhaRepository.Obter(linhaId);

            if (linha == null) throw new NotFoundException("Linha não encontrada com o ID informado.");

            return linha;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter linha por ID: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid linhaId, LinhaPutRequest request, AuditoriaUsuario usuario)
    {
        try
        {
            var linhaAnterior = await _linhaRepository.Obter(linhaId);

            await ValidarCampos(request.NumeroLinha, request.NumeroInicial, request.NumeroFinal, request.Categoria, request.Genero, request.Exclusiva, request.ClienteId, request.ProcessoProdutivo, request.FabricanteId, linhaId);

            var linha = new Linha
            {
                LinhaId = linhaId,
                NumeroLinha = request.NumeroLinha,
                NumeroInicial = request.NumeroInicial!.Value,
                NumeroFinal = request.NumeroFinal!.Value,
                Categoria = request.Categoria,
                Genero = request.Genero,
                Exclusiva = request.Exclusiva,
                ClienteId = request.ClienteId,
                ProcessoProdutivo = request.ProcessoProdutivo,
                FabricanteId = request.FabricanteId,
                Rendimento = request.Rendimento
            };

            var affected = await _linhaRepository.Atualizar(linha);

            if (affected <= 0) throw new NotFoundException("Linha não encontrada com o ID informado.");

            if (linhaAnterior != null)
            {
                var linhaAtualizada = await _linhaRepository.Obter(linhaId) ?? linha;
                _auditoriaService.RegistrarAlteracao(usuario, "Linha", linhaId, linhaAnterior, linhaAtualizada);
            }
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
            throw new Exception($"Erro ao atualizar linha: {ex.Message}");
        }
    }

    public async Task<bool> LinhaExiste(Guid linhaId)
    {
        return await _linhaRepository.VerificarLinhaExiste(linhaId);
    }

    private async Task ValidarCampos(
        int linha,
        short? numeroInicial,
        short? numeroFinal,
        CategoriaLinha categoria,
        GeneroLinha genero,
        bool exclusiva,
        Guid? clienteId,
        ProcessoProdutivoLinha processoProdutivo,
        Guid? fabricanteId,
        Guid linhaId)
    {
        if (linha <= 0)
            AddError(nameof(Linha.NumeroLinha), "Informe a linha maior que 0.");

        if (!Enum.IsDefined(typeof(CategoriaLinha), (int)categoria))
            AddError(nameof(Linha.Categoria), "Informe a categoria.");

        if (!Enum.IsDefined(typeof(GeneroLinha), (int)genero))
            AddError(nameof(Linha.Genero), "Informe o gênero.");

        if (!Enum.IsDefined(typeof(ProcessoProdutivoLinha), (int)processoProdutivo))
            AddError(nameof(Linha.ProcessoProdutivo), "Informe o processo produtivo.");

        if (exclusiva && !clienteId.HasValue)
            AddError(nameof(Linha.ClienteId), "Informe a marca/cliente.");

        if (!numeroInicial.HasValue || numeroInicial <= 0)
            AddError(nameof(Linha.NumeroInicial), "Informe o N° inicial maior que 0.");

        if (!numeroFinal.HasValue || numeroFinal <= 0)
            AddError(nameof(Linha.NumeroFinal), "Informe o N° final maior que 0.");

        if (numeroInicial.HasValue && numeroFinal.HasValue
            && numeroInicial.Value > 0
            && numeroFinal.Value > 0
            && numeroFinal.Value < numeroInicial.Value)
            AddError(nameof(Linha.NumeroFinal), "Informe o número final maior ou igual ao número inicial.");

        if (linhaId != Guid.Empty)
        {
            var linhaExiste = await _linhaRepository.VerificarLinhaExiste(linhaId);

            if (!linhaExiste)
                AddError(nameof(Linha.LinhaId), "Linha não encontrada com o ID informado.");
        }

        if (linha > 0)
        {
            var linhaExiste = await _linhaRepository.VerificarLinhaExiste(linha, clienteId, linhaId);

            if (linhaExiste)
                AddError(nameof(Linha.NumeroLinha), "Esta linha já está sendo utilizada para este cliente.");
        }

        if (!fabricanteId.HasValue)
            AddError(nameof(Linha.FabricanteId), "Informe o fabricante.");

        if (fabricanteId.HasValue)
        {
            var fabricanteExiste = await _fornecedorRepository.VerificarFornecedorExiste(fabricanteId.Value);

            if (!fabricanteExiste)
                AddError(nameof(Linha.FabricanteId), "Fabricante não encontrado.");
        }

        if (clienteId.HasValue)
        {
            var clienteExiste = await _clienteRepository.VerificarClienteExiste(clienteId.Value);

            if (!clienteExiste)
                AddError(nameof(Linha.ClienteId), "Cliente não encontrado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}
