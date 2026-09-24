using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class ClienteEnderecoService : BaseService
{
    private readonly IClienteRepository _clienteRepository;
    private readonly IClienteEnderecoRepository _clienteEnderecoRepository;

    public ClienteEnderecoService(
        IClienteRepository clienteRepository,
        IClienteEnderecoRepository clienteEnderecoRepository)
    {
        _clienteRepository = clienteRepository;
        _clienteEnderecoRepository = clienteEnderecoRepository;
    }

    public async Task<Guid> Cadastrar(Guid clienteId, ClienteEnderecoPostRequest enderecoRequest)
    {
        try
        {
            await ValidarEndereco(clienteId, enderecoRequest);
            var enderecos = await _clienteEnderecoRepository.Obter(clienteId);
            var primeiroEndereco = enderecos.Count == 0;
            var definirComoDefault = enderecoRequest.Default || primeiroEndereco;

            var endereco = new ClienteEndereco
            {
                ClienteEnderecoId = Guid.NewGuid(),
                ClienteId = clienteId,
                Logradouro = enderecoRequest.Logradouro,
                Numero = enderecoRequest.Numero,
                Complemento = enderecoRequest.Complemento,
                Bairro = enderecoRequest.Bairro,
                Cidade = enderecoRequest.Cidade,
                Uf = enderecoRequest.Uf,
                Cep = enderecoRequest.Cep,
                Default = primeiroEndereco
            };

            var enderecoId = await _clienteEnderecoRepository.Cadastrar(endereco);

            if (definirComoDefault)
                await _clienteEnderecoRepository.DefinirDefault(clienteId, enderecoId);

            return enderecoId;
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
            throw new Exception($"Erro ao cadastrar endereço do cliente: {ex.Message}");
        }
    }

    public async Task Validar(Guid clienteId, ClienteEnderecoValidacaoRequest enderecoRequest)
    {
        try
        {
            await ValidarEndereco(clienteId, enderecoRequest);
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
            throw new Exception($"Erro ao validar endereço do cliente: {ex.Message}");
        }
    }

    public async Task Atualizar(Guid clienteId, Guid clienteEnderecoId, ClienteEnderecoPutRequest enderecoRequest)
    {
        try
        {
            await ValidarEndereco(clienteId, enderecoRequest);

            var endereco = new ClienteEndereco
            {
                ClienteEnderecoId = clienteEnderecoId,
                ClienteId = clienteId,
                Logradouro = enderecoRequest.Logradouro,
                Numero = enderecoRequest.Numero,
                Complemento = enderecoRequest.Complemento,
                Bairro = enderecoRequest.Bairro,
                Cidade = enderecoRequest.Cidade,
                Uf = enderecoRequest.Uf,
                Cep = enderecoRequest.Cep
            };

            var affected = await _clienteEnderecoRepository.Atualizar(endereco);

            if (affected <= 0) throw new NotFoundException("Endereço não encontrado para o cliente informado.");

            await DefinirEnderecoUnicoComoDefault(clienteId);
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
            throw new Exception($"Erro ao atualizar endereço do cliente: {ex.Message}");
        }
    }

    public async Task Excluir(Guid clienteId, Guid clienteEnderecoId)
    {
        try
        {
            await ValidarClienteExiste(clienteId);

            var enderecos = await _clienteEnderecoRepository.Obter(clienteId);
            var endereco = enderecos.FirstOrDefault(x => x.ClienteEnderecoId == clienteEnderecoId);

            if (endereco == null) throw new NotFoundException("Endereço não encontrado para o cliente informado.");

            var affected = await _clienteEnderecoRepository.Excluir(clienteId, clienteEnderecoId);

            if (affected <= 0) throw new NotFoundException("Endereço não encontrado para o cliente informado.");

            await DefinirEnderecoUnicoComoDefault(clienteId);
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
            throw new Exception($"Erro ao excluir endereço do cliente: {ex.Message}");
        }
    }

    public async Task DefinirDefault(Guid clienteId, Guid clienteEnderecoId)
    {
        try
        {
            await ValidarClienteExiste(clienteId);

            var affected = await _clienteEnderecoRepository.DefinirDefault(clienteId, clienteEnderecoId);

            if (affected <= 0) throw new NotFoundException("Endereço não encontrado para o cliente informado.");
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao definir endereço padrão do cliente: {ex.Message}");
        }
    }

    private async Task DefinirEnderecoUnicoComoDefault(Guid clienteId)
    {
        var enderecos = await _clienteEnderecoRepository.Obter(clienteId);

        if (enderecos.Count > 0 && !enderecos.Any(endereco => endereco.Default))
            await _clienteEnderecoRepository.DefinirDefault(clienteId, enderecos[0].ClienteEnderecoId);
    }

    private async Task ValidarEndereco(Guid clienteId, ClienteEnderecoPutRequest endereco)
    {
        await ValidarEnderecoBase(clienteId, endereco.Logradouro, endereco.Numero, endereco.Cidade, endereco.Uf);
    }

    private async Task ValidarEndereco(Guid clienteId, ClienteEnderecoPostRequest endereco)
    {
        await ValidarEnderecoBase(clienteId, endereco.Logradouro, endereco.Numero, endereco.Cidade, endereco.Uf);
    }

    private async Task ValidarEnderecoBase(Guid clienteId, string logradouro, string numero, string cidade, string uf)
    {
        await ValidarClienteExiste(clienteId);

        if (string.IsNullOrWhiteSpace(logradouro))
            AddError(nameof(ClienteEndereco.Logradouro), "Informe o endereço.");

        if (string.IsNullOrWhiteSpace(numero))
            AddError(nameof(ClienteEndereco.Numero), "Informe o número.");

        if (string.IsNullOrWhiteSpace(cidade))
            AddError(nameof(ClienteEndereco.Cidade), "Informe a cidade.");

        if (string.IsNullOrWhiteSpace(uf))
            AddError(nameof(ClienteEndereco.Uf), "Informe a UF.");

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