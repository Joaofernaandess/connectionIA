using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class ClienteContatoService : BaseService
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IClienteContatoRepository _clienteContatoRepository;

    public ClienteContatoService(
        IClienteRepository clienteRepository,
        IClienteContatoRepository clienteContatoRepository)
    {
        _clienteRepository = clienteRepository;
        _clienteContatoRepository = clienteContatoRepository;
    }

    public async Task<Guid> Cadastrar(Guid clienteId, ClienteContatoPostRequest contatoRequest)
    {
        try
        {
            await ValidarContato(clienteId, contatoRequest);
            contatoRequest.Valor = ContatoHelper.NormalizarValor(contatoRequest.TipoContato, contatoRequest.Valor);
            var contatos = await _clienteContatoRepository.Obter(clienteId);
            var primeiroContatoDoTipo = !contatos.Any(x => x.TipoContato == contatoRequest.TipoContato);
            var definirComoDefault = contatoRequest.Default || primeiroContatoDoTipo;

            var contato = new ClienteContato
            {
                ClienteContatoId = Guid.NewGuid(),
                ClienteId = clienteId,
                TipoContato = contatoRequest.TipoContato,
                Valor = contatoRequest.Valor,
                Default = primeiroContatoDoTipo
            };

            var contatoId = await _clienteContatoRepository.Cadastrar(contato);

            if (definirComoDefault)
                await _clienteContatoRepository.DefinirDefault(clienteId, contatoId);

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
            throw new Exception($"Erro ao cadastrar contato do cliente: {ex.Message}");
        }
    }

    public async Task Validar(Guid clienteId, ClienteContatoValidacaoRequest contatoRequest)
    {
        try
        {
            if (contatoRequest.ClienteContatoId.HasValue)
                await ValidarContatoBase(clienteId, contatoRequest.TipoContato, contatoRequest.Valor, contatoRequest.ClienteContatoId);
            else
                await ValidarContatoBase(clienteId, contatoRequest.TipoContato, contatoRequest.Valor);
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
            throw new Exception($"Erro ao validar contato do cliente: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid clienteId, Guid clienteContatoId, ClienteContatoPutRequest contatoRequest)
    {
        try
        {
            await ValidarContato(clienteId, clienteContatoId, contatoRequest);
            contatoRequest.Valor = ContatoHelper.NormalizarValor(contatoRequest.TipoContato, contatoRequest.Valor);
            var contatosAntes = await _clienteContatoRepository.Obter(clienteId);
            var tipoContatoAnterior = contatosAntes
                .FirstOrDefault(x => x.ClienteContatoId == clienteContatoId)
                ?.TipoContato;

            var contato = new ClienteContato
            {
                ClienteContatoId = clienteContatoId,
                ClienteId = clienteId,
                TipoContato = contatoRequest.TipoContato,
                Valor = contatoRequest.Valor
            };

            var affected = await _clienteContatoRepository.Atualizar(contato);

            if (affected <= 0) throw new NotFoundException("Contato não encontrado para o cliente informado.");

            if (tipoContatoAnterior.HasValue)
                await DefinirContatoUnicoComoDefault(clienteId, tipoContatoAnterior.Value);

            await DefinirContatoUnicoComoDefault(clienteId, contatoRequest.TipoContato);
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
            throw new Exception($"Erro ao atualizar contato do cliente: {ex.Message}");
        }
    }

    public async Task Excluir(Guid clienteId, Guid clienteContatoId)
    {
        try
        {
            await ValidarClienteExiste(clienteId);
            var contatosAntes = await _clienteContatoRepository.Obter(clienteId);
            var tipoContato = contatosAntes
                .FirstOrDefault(x => x.ClienteContatoId == clienteContatoId)
                ?.TipoContato;

            var affected = await _clienteContatoRepository.Excluir(clienteId, clienteContatoId);

            if (affected <= 0) throw new NotFoundException("Contato não encontrado para o cliente informado.");

            if (tipoContato.HasValue)
                await DefinirContatoUnicoComoDefault(clienteId, tipoContato.Value);
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao excluir contato do cliente: {ex.Message}");
        }
    }

    public async Task DefinirDefault(Guid clienteId, Guid clienteContatoId)
    {
        try
        {
            await ValidarClienteExiste(clienteId);

            var affected = await _clienteContatoRepository.DefinirDefault(clienteId, clienteContatoId);

            if (affected <= 0) throw new NotFoundException("Contato não encontrado para o cliente informado.");
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao definir contato padrão do cliente: {ex.Message}");
        }
    }

    private async Task DefinirContatoUnicoComoDefault(Guid clienteId, TipoContato tipoContato)
    {
        var contatos = await _clienteContatoRepository.Obter(clienteId);
        var contatosDoTipo = contatos
            .Where(x => x.TipoContato == tipoContato)
            .ToList();

        if (contatosDoTipo.Count == 1 && !contatosDoTipo[0].Default)
            await _clienteContatoRepository.DefinirDefault(clienteId, contatosDoTipo[0].ClienteContatoId);
    }

    private async Task ValidarContato(Guid clienteId, ClienteContatoPostRequest contato)
    {
        await ValidarContatoBase(clienteId, contato.TipoContato, contato.Valor);
    }

    private async Task ValidarContato(Guid clienteId, Guid clienteContatoId, ClienteContatoPutRequest contato)
    {
        await ValidarContatoBase(clienteId, contato.TipoContato, contato.Valor, clienteContatoId);
    }

    private async Task ValidarContatoBase(Guid clienteId, TipoContato tipoContato, string valor, Guid? clienteContatoIdIgnorado = null)
    {
        await ValidarClienteExiste(clienteId);

        if (!Enum.IsDefined(tipoContato))
            AddError(nameof(ClienteContato.TipoContato), "Informe um tipo de contato válido.");

        if (string.IsNullOrWhiteSpace(valor))
            AddError(nameof(ClienteContato.Valor), "Informe o valor do contato.");
        else if (tipoContato == TipoContato.Telefone && !ContatoHelper.TelefoneValido(valor))
            AddError(nameof(ClienteContato.Valor), "Informe um telefone válido.");
        else if ((tipoContato == TipoContato.Email || tipoContato == TipoContato.EmailNfe) && !ContatoHelper.EmailValido(valor))
            AddError(nameof(ClienteContato.Valor), "Informe um e-mail válido.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    private async Task ValidarClienteExiste(Guid clienteId)
    {
        if (clienteId == Guid.Empty)
            throw new NotFoundException("Cliente não encontrado com o ID informado.");

        var clienteExiste = await _clienteRepository.VerificarClienteExiste(clienteId);

        if (!clienteExiste)
            throw new NotFoundException("Cliente não encontrado com o ID informado.");
    }
}