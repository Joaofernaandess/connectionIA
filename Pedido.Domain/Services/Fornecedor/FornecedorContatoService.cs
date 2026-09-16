using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class FornecedorContatoService : BaseService
{
    private readonly IFornecedorRepository _fornecedorRepository;
    private readonly IFornecedorContatoRepository _fornecedorContatoRepository;

    public FornecedorContatoService(
        IFornecedorRepository fornecedorRepository,
        IFornecedorContatoRepository fornecedorContatoRepository)
    {
        _fornecedorRepository = fornecedorRepository;
        _fornecedorContatoRepository = fornecedorContatoRepository;
    }

    public async Task<Guid> Cadastrar(Guid fornecedorId, FornecedorContatoPostRequest contatoRequest)
    {
        try
        {
            await ValidarContato(fornecedorId, contatoRequest);
            contatoRequest.Valor = ContatoHelper.NormalizarValor(contatoRequest.TipoContato, contatoRequest.Valor);
            var contatos = await _fornecedorContatoRepository.Obter(fornecedorId);
            var primeiroContatoDoTipo = !contatos.Any(x => x.TipoContato == contatoRequest.TipoContato);

            var contato = new FornecedorContato
            {
                FornecedorContatoId = Guid.NewGuid(),
                FornecedorId = fornecedorId,
                TipoContato = contatoRequest.TipoContato,
                Valor = contatoRequest.Valor,
                Default = contatoRequest.Default || primeiroContatoDoTipo
            };

            var contatoId = await _fornecedorContatoRepository.Cadastrar(contato);

            if (contato.Default)
                await _fornecedorContatoRepository.DefinirDefault(fornecedorId, contatoId);

            return contatoId;
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
            throw new Exception($"Erro ao cadastrar contato do fornecedor: {ex.Message}");
        }
    }

    public async Task Validar(Guid fornecedorId, FornecedorContatoValidacaoRequest contatoRequest)
    {
        try
        {
            if (contatoRequest.FornecedorContatoId.HasValue)
                await ValidarContatoBase(fornecedorId, contatoRequest.TipoContato, contatoRequest.Valor, contatoRequest.FornecedorContatoId);
            else
                await ValidarContatoBase(fornecedorId, contatoRequest.TipoContato, contatoRequest.Valor);
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
            throw new Exception($"Erro ao validar contato do fornecedor: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid fornecedorId, Guid fornecedorContatoId, FornecedorContatoPutRequest contatoRequest)
    {
        await ValidarContato(fornecedorId, fornecedorContatoId, contatoRequest);
        contatoRequest.Valor = ContatoHelper.NormalizarValor(contatoRequest.TipoContato, contatoRequest.Valor);
        var contatosAntes = await _fornecedorContatoRepository.Obter(fornecedorId);
        var tipoContatoAnterior = contatosAntes
            .FirstOrDefault(x => x.FornecedorContatoId == fornecedorContatoId)
            ?.TipoContato;

        var contato = new FornecedorContato
        {
            FornecedorContatoId = fornecedorContatoId,
            FornecedorId = fornecedorId,
            TipoContato = contatoRequest.TipoContato,
            Valor = contatoRequest.Valor
        };

        var affected = await _fornecedorContatoRepository.Atualizar(contato);

        if (affected <= 0) throw new NotFoundException("Contato não encontrado para o fornecedor informado.");

        if (tipoContatoAnterior.HasValue)
            await DefinirContatoUnicoComoDefault(fornecedorId, tipoContatoAnterior.Value);

        await DefinirContatoUnicoComoDefault(fornecedorId, contatoRequest.TipoContato);
    }

    public async Task Excluir(Guid fornecedorId, Guid fornecedorContatoId)
    {
        await ValidarFornecedorExiste(fornecedorId);
        var contatosAntes = await _fornecedorContatoRepository.Obter(fornecedorId);
        var tipoContato = contatosAntes
            .FirstOrDefault(x => x.FornecedorContatoId == fornecedorContatoId)
            ?.TipoContato;

        var affected = await _fornecedorContatoRepository.Excluir(fornecedorId, fornecedorContatoId);

        if (affected <= 0) throw new NotFoundException("Contato não encontrado para o fornecedor informado.");

        if (tipoContato.HasValue)
            await DefinirContatoUnicoComoDefault(fornecedorId, tipoContato.Value);
    }

    public async Task DefinirDefault(Guid fornecedorId, Guid fornecedorContatoId)
    {
        await ValidarFornecedorExiste(fornecedorId);

        var affected = await _fornecedorContatoRepository.DefinirDefault(fornecedorId, fornecedorContatoId);

        if (affected <= 0) throw new NotFoundException("Contato não encontrado para o fornecedor informado.");
    }

    private async Task DefinirContatoUnicoComoDefault(Guid fornecedorId, TipoContato tipoContato)
    {
        var contatos = await _fornecedorContatoRepository.Obter(fornecedorId);
        var contatosDoTipo = contatos
            .Where(x => x.TipoContato == tipoContato)
            .ToList();

        if (contatosDoTipo.Count == 1 && !contatosDoTipo[0].Default)
            await _fornecedorContatoRepository.DefinirDefault(fornecedorId, contatosDoTipo[0].FornecedorContatoId);
    }

    private async Task ValidarContato(Guid fornecedorId, FornecedorContatoPostRequest contato)
    {
        await ValidarContatoBase(fornecedorId, contato.TipoContato, contato.Valor);
    }

    private async Task ValidarContato(Guid fornecedorId, Guid fornecedorContatoId, FornecedorContatoPutRequest contato)
    {
        await ValidarContatoBase(fornecedorId, contato.TipoContato, contato.Valor, fornecedorContatoId);
    }

    private async Task ValidarContatoBase(Guid fornecedorId, TipoContato tipoContato, string valor, Guid? fornecedorContatoIdIgnorado = null)
    {
        await ValidarFornecedorExiste(fornecedorId);

        if (!Enum.IsDefined(tipoContato))
            AddError(nameof(FornecedorContato.TipoContato), "Informe um tipo de contato válido.");

        if (string.IsNullOrWhiteSpace(valor))
            AddError(nameof(FornecedorContato.Valor), "Informe o valor do contato.");
        else if (tipoContato == TipoContato.Telefone && !ContatoHelper.TelefoneValido(valor))
            AddError(nameof(FornecedorContato.Valor), "Informe um telefone válido.");
        else if ((tipoContato == TipoContato.Email || tipoContato == TipoContato.EmailNfe) && !ContatoHelper.EmailValido(valor))
            AddError(nameof(FornecedorContato.Valor), "Informe um e-mail válido.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarFornecedorExiste(Guid fornecedorId)
    {
        if (fornecedorId == Guid.Empty)
            throw new NotFoundException("Fornecedor não encontrado com o ID informado.");

        var fornecedorExiste = await _fornecedorRepository.VerificarFornecedorExiste(fornecedorId);

        if (!fornecedorExiste)
            throw new NotFoundException("Fornecedor não encontrado com o ID informado.");
    }
}