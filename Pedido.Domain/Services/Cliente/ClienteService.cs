using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;
using Pedido.Domain.Utils;

namespace Pedido.Domain.Services;

public class ClienteService : BaseService
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IClienteEnderecoRepository _clienteEnderecoRepository;
    private readonly IClienteContatoRepository _clienteContatoRepository;

    public ClienteService(
        IClienteRepository clienteRepository,
        IClienteEnderecoRepository clienteEnderecoRepository,
        IClienteContatoRepository clienteContatoRepository)
    {
        _clienteRepository = clienteRepository;
        _clienteEnderecoRepository = clienteEnderecoRepository;
        _clienteContatoRepository = clienteContatoRepository;
    }

    public async Task<Guid> Cadastrar(ClientePostRequest clienteRequest)
    {
        try
        {
            clienteRequest.Cnpj = StringHelper.ObterApenasNumeros(clienteRequest.Cnpj);
            clienteRequest.InscricaoEstadual = StringHelper.ObterApenasNumeros(clienteRequest.InscricaoEstadual);

            await ValidarCampos(clienteRequest, Guid.Empty);

            var cliente = new Cliente
            {
                ClienteId = Guid.NewGuid(),
                RazaoSocial = clienteRequest.RazaoSocial,
                Fantasia = clienteRequest.Fantasia,
                Cnpj = clienteRequest.Cnpj,
                InscricaoEstadual = clienteRequest.InscricaoEstadual,
            };

            return await _clienteRepository.Cadastrar(cliente);
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar cliente: {ex.Message}");
        }
    }

    public async Task<List<ClienteGetResponse>> Obter(ClienteGetRequest request)
    {
        try
        {
            return await _clienteRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter clientes: {ex.Message}");
        }
    }

    public async Task<Cliente> Obter(Guid clienteId)
    {
        try
        {
            var cliente = await _clienteRepository.Obter(clienteId);

            if (cliente == null) throw new NotFoundException("Cliente não encontrado com o ID informado.");

            cliente.Enderecos = await _clienteEnderecoRepository.Obter(cliente.ClienteId);
            cliente.Contatos = await _clienteContatoRepository.Obter(cliente.ClienteId);

            return cliente;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter cliente por ID: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid clienteId, ClientePutRequest clienteRequest)
    {
        try
        {
            clienteRequest.Cnpj = StringHelper.ObterApenasNumeros(clienteRequest.Cnpj);
            clienteRequest.InscricaoEstadual = StringHelper.ObterApenasNumeros(clienteRequest.InscricaoEstadual);

            await ValidarCampos(clienteRequest, clienteId);

            var cliente = new Cliente
            {
                ClienteId = clienteId,
                RazaoSocial = clienteRequest.RazaoSocial,
                Fantasia = clienteRequest.Fantasia,
                Cnpj = clienteRequest.Cnpj,
                InscricaoEstadual = clienteRequest.InscricaoEstadual
            };

            var affected = await _clienteRepository.Atualizar(cliente);

            if (affected <= 0) throw new NotFoundException("Cliente não encontrado com o ID informado.");
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
            throw new Exception($"Erro ao atualizar cliente: {ex.Message}");
        }
    }

    public async Task<bool> ClienteExiste(Guid clienteId)
    {
        return await _clienteRepository.VerificarClienteExiste(clienteId);
    }

    private async Task ValidarCampos(ClientePostRequest cliente, Guid clienteId)
    {
        await ValidarCamposBase(cliente.RazaoSocial, cliente.Cnpj, clienteId);
    }

    private async Task ValidarCampos(ClientePutRequest cliente, Guid clienteId)
    {
        await ValidarCamposBase(cliente.RazaoSocial, cliente.Cnpj, clienteId);
    }

    private async Task ValidarCamposBase(string razaoSocial, string cnpj, Guid clienteId)
    {
        if (string.IsNullOrWhiteSpace(razaoSocial))
            AddError(nameof(Cliente.RazaoSocial), "Informe a razão social.");

        if (string.IsNullOrWhiteSpace(cnpj))
        {
            AddError(nameof(Cliente.Cnpj), "Informe o CNPJ.");
        }
        else
        {
            var cnpjExiste = await _clienteRepository.VerificarClienteExiste(cnpj, clienteId);

            if (cnpjExiste)
                AddError(nameof(Cliente.Cnpj), "Este CNPJ já está sendo utilizado.");
        }

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}
