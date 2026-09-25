using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Interfaces.Shared; // <- Import do motor de auditoria
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class LinhaService : BaseService
{
    private readonly ILinhaRepository _linhaRepository;
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IClienteRepository _clienteRepository;
    private readonly IAuditoriaService _auditoriaService; // <- Injeção da Auditoria

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

    // Parâmetros do usuário adicionados para o log
    public async Task<Guid> Cadastrar(LinhaPostRequest request, Guid usuarioId, string nomeUsuario)
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

            var idGerado = await _linhaRepository.Cadastrar(linha);

            // ==========================================
            // MOTOR DE AUDITORIA SEM AWAIT
            // ==========================================
            _ = Task.Run(() =>
            {
                try
                {
                    _auditoriaService.RegistrarAlteracao(
                        entidadeId: linha.LinhaId,
                        tipoEntidade: "Linha",
                        usuarioId: usuarioId,
                        nomeUsuario: nomeUsuario,
                        estadoAntigo: new Linha(), // Linha vazia pois é criação nova
                        estadoNovo: linha
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erro no motor de auditoria: {ex.Message}");
                }
            });

            return idGerado;
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

    // Parâmetros do usuário adicionados para o log
    public async Task Atualizar(Guid linhaId, LinhaPutRequest request, Guid usuarioId, string nomeUsuario)
    {
        try
        {
            // Busca o estado atual para comparar depois
            var linhaExistente = await _linhaRepository.Obter(linhaId);
            if (linhaExistente == null) throw new NotFoundException("Linha não encontrada com o ID informado.");

            await ValidarCampos(request.NumeroLinha, request.NumeroInicial, request.NumeroFinal, request.Categoria, request.Genero, request.Exclusiva, request.ClienteId, request.ProcessoProdutivo, request.FabricanteId, linhaId);

            // Cria uma cópia independente do estado antigo (Clone)
            var estadoAntigo = new Linha
            {
                LinhaId = linhaExistente.LinhaId,
                NumeroLinha = linhaExistente.NumeroLinha,
                NumeroInicial = linhaExistente.NumeroInicial,
                NumeroFinal = linhaExistente.NumeroFinal,
                Categoria = linhaExistente.Categoria,
                Genero = linhaExistente.Genero,
                Exclusiva = linhaExistente.Exclusiva,
                ClienteId = linhaExistente.ClienteId,
                ProcessoProdutivo = linhaExistente.ProcessoProdutivo,
                FabricanteId = linhaExistente.FabricanteId,
                Rendimento = linhaExistente.Rendimento
            };

            var linhaAtualizada = new Linha
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

            var affected = await _linhaRepository.Atualizar(linhaAtualizada);

            if (affected <= 0) throw new NotFoundException("Linha não encontrada com o ID informado.");

            // ==========================================
            // MOTOR DE AUDITORIA SEM AWAIT
            // ==========================================
            _ = Task.Run(() =>
            {
                try
                {
                    _auditoriaService.RegistrarAlteracao(
                        entidadeId: linhaId,
                        tipoEntidade: "Linha",
                        usuarioId: usuarioId,
                        nomeUsuario: nomeUsuario,
                        estadoAntigo: estadoAntigo,
                        estadoNovo: linhaAtualizada
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erro crítico no motor de auditoria: {ex.Message}");
                }
            });
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