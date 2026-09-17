using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class LinhaProdutoService : BaseService
{
    private readonly ILinhaProdutoRepository _linhaProdutoRepository;
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IClienteRepository _clienteRepository;

    public LinhaProdutoService(
        ILinhaProdutoRepository linhaProdutoRepository,
        IFornecedorRepository fornecedorRepository,
        IClienteRepository clienteRepository)
    {
        _linhaProdutoRepository = linhaProdutoRepository;
        _fornecedorRepository = fornecedorRepository;
        _clienteRepository = clienteRepository;
    }

    public async Task<Guid> Cadastrar(LinhaProdutoPostRequest request)
    {
        try
        {
            await ValidarCampos(request.Linha, request.NumeroInicial, request.NumeroFinal, request.Categoria, request.Genero, request.Exclusiva, request.ClienteId, request.ProcessoProdutivo, request.FabricanteId, Guid.Empty);

            var linhaProduto = new LinhaProduto
            {
                LinhaProdutoId = Guid.NewGuid(),
                Linha = request.Linha,
                NumeroInicial = request.NumeroInicial,
                NumeroFinal = request.NumeroFinal,
                Categoria = request.Categoria,
                Genero = request.Genero,
                Exclusiva = request.Exclusiva,
                ClienteId = request.ClienteId,
                ProcessoProdutivo = request.ProcessoProdutivo,
                FabricanteId = request.FabricanteId,
                Rendimento = request.Rendimento
            };

            return await _linhaProdutoRepository.Cadastrar(linhaProduto);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar linha de produto: {ex.Message}");
        }
    }

    public async Task<List<LinhaProdutoGetResponse>> Obter(LinhaProdutoGetRequest request)
    {
        try
        {
            return await _linhaProdutoRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter linhas de produto: {ex.Message}");
        }
    }

    public async Task<LinhaProduto> Obter(Guid linhaProdutoId)
    {
        try
        {
            var linhaProduto = await _linhaProdutoRepository.Obter(linhaProdutoId);

            if (linhaProduto == null) throw new NotFoundException("Linha de produto não encontrada com o ID informado.");

            return linhaProduto;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter linha de produto por ID: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid linhaProdutoId, LinhaProdutoPutRequest request)
    {
        try
        {
            await ValidarCampos(request.Linha, request.NumeroInicial, request.NumeroFinal, request.Categoria, request.Genero, request.Exclusiva, request.ClienteId, request.ProcessoProdutivo, request.FabricanteId, linhaProdutoId);

            var linhaProduto = new LinhaProduto
            {
                LinhaProdutoId = linhaProdutoId,
                Linha = request.Linha,
                NumeroInicial = request.NumeroInicial,
                NumeroFinal = request.NumeroFinal,
                Categoria = request.Categoria,
                Genero = request.Genero,
                Exclusiva = request.Exclusiva,
                ClienteId = request.ClienteId,
                ProcessoProdutivo = request.ProcessoProdutivo,
                FabricanteId = request.FabricanteId,
                Rendimento = request.Rendimento
            };

            var affected = await _linhaProdutoRepository.Atualizar(linhaProduto);

            if (affected <= 0) throw new NotFoundException("Linha de produto não encontrada com o ID informado.");
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
            throw new Exception($"Erro ao atualizar linha de produto: {ex.Message}");
        }
    }

    public async Task<bool> LinhaProdutoExiste(Guid linhaProdutoId)
    {
        return await _linhaProdutoRepository.VerificarLinhaProdutoExiste(linhaProdutoId);
    }

    private async Task ValidarCampos(
        int linha,
        short numeroInicial,
        short numeroFinal,
        CategoriaLinhaProduto categoria,
        GeneroLinhaProduto genero,
        bool exclusiva,
        Guid? clienteId,
        ProcessoProdutivoLinhaProduto processoProdutivo,
        Guid? fabricanteId,
        Guid linhaProdutoId)
    {
        if (linha <= 0)
            AddError(nameof(LinhaProduto.Linha), "Informe a linha.");

        if (!Enum.IsDefined(typeof(CategoriaLinhaProduto), (int)categoria))
            AddError(nameof(LinhaProduto.Categoria), "Informe a categoria.");

        if (!Enum.IsDefined(typeof(GeneroLinhaProduto), (int)genero))
            AddError(nameof(LinhaProduto.Genero), "Informe o gênero.");

        if (!Enum.IsDefined(typeof(ProcessoProdutivoLinhaProduto), (int)processoProdutivo))
            AddError(nameof(LinhaProduto.ProcessoProdutivo), "Informe o processo produtivo.");

        if (exclusiva && !clienteId.HasValue)
            AddError(nameof(LinhaProduto.ClienteId), "Informe a marca/cliente.");

        if (numeroInicial <= 0)
            AddError(nameof(LinhaProduto.NumeroInicial), "Informe o número inicial.");

        if (numeroFinal <= 0)
            AddError(nameof(LinhaProduto.NumeroFinal), "Informe o número final.");

        if (numeroInicial > 0 && numeroFinal > 0 && numeroFinal < numeroInicial)
            AddError(nameof(LinhaProduto.NumeroFinal), "Informe o número final maior ou igual ao número inicial.");

        if (linhaProdutoId != Guid.Empty)
        {
            var linhaProdutoExiste = await _linhaProdutoRepository.VerificarLinhaProdutoExiste(linhaProdutoId);

            if (!linhaProdutoExiste)
                AddError(nameof(LinhaProduto.LinhaProdutoId), "Linha de produto não encontrada com o ID informado.");
        }

        if (linha > 0)
        {
            var linhaExiste = await _linhaProdutoRepository.VerificarLinhaExiste(linha, clienteId, linhaProdutoId);

            if (linhaExiste)
                AddError(nameof(LinhaProduto.Linha), "Esta linha já está sendo utilizada para este cliente.");
        }

        if (!fabricanteId.HasValue)
            AddError(nameof(LinhaProduto.FabricanteId), "Informe o fabricante.");

        if (fabricanteId.HasValue)
        {
            var fabricanteExiste = await _fornecedorRepository.VerificarFornecedorExiste(fabricanteId.Value);

            if (!fabricanteExiste)
                AddError(nameof(LinhaProduto.FabricanteId), "Fabricante não encontrado.");
        }

        if (clienteId.HasValue)
        {
            var clienteExiste = await _clienteRepository.VerificarClienteExiste(clienteId.Value);

            if (!clienteExiste)
                AddError(nameof(LinhaProduto.ClienteId), "Cliente não encontrado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

}
