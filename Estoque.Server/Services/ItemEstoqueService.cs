using Estoque.Server.Exceptions;
using Estoque.Server.Models;
using Estoque.Server.Repositories;
using System.Data;

namespace Estoque.Server.Services;

public class ItemEstoqueService : BaseService
{
    private readonly ItemEstoqueRepository _repository;
    private readonly HistoricoRepository _historicoRepository;
    private readonly IDbConnection _connection;

    public ItemEstoqueService(ItemEstoqueRepository repository, HistoricoRepository historicoRepository, IDbConnection connection)
    {
        _repository = repository;
        _historicoRepository = historicoRepository;
        _connection = connection;
    }

    public async Task<Guid> Cadastrar(ItemEstoque item)
    {
        try
        {
            await ValidarCampos(item, Guid.Empty);

            Guid itemId = await _repository.Cadastrar(item);

            return itemId;
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar item de estoque: {ex.Message}");
        }
    }

    public async Task<int> Atualizar(ItemEstoque item, Guid itemEstoqueId)
    {
        try
        {
            var itemExistente = await _repository.Obter(itemEstoqueId);

            if (itemExistente == null) throw new NotFoundException("Item de estoque não encontrado com os parâmetros informados.");

            item.UnidadeOrganizacionalId = itemExistente.UnidadeOrganizacionalId;

            await ValidarCampos(item, itemEstoqueId);

            return await _repository.AtualizarItemEstoque(item, itemEstoqueId);
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
            throw new Exception($"Erro ao atualizar item de estoque: {ex.Message}");
        }
    }


    public async Task<List<ItemEstoqueRecuperado>> Obter(int skip, int top, string? descricao, Guid? unidadeOrganizacionalId, Guid? espacoId)
    {
        try
        {
            return await _repository.Obter(skip, top, descricao, unidadeOrganizacionalId, espacoId);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao Obter itens: {ex.Message}");
        }
    }

    public async Task<ItemEstoqueRecuperado> Obter(Guid itemEstoqueId)
    {
        try
        {
            var item = await _repository.Obter(itemEstoqueId);

            if (item == null) throw new NotFoundException("Item não encontrado com o ID informado.");

            return item;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter item por ID: {ex.Message}");
        }
    }

    public async Task<List<HistoricoRecuperado>> ObterHistorico(Guid itemEstoqueId)
    {
        try
        {
            return await _historicoRepository.ObterHistoricoPorItem(itemEstoqueId);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao recuperar histórico do item: {ex.Message}");
        }
    }

    public async Task<bool> Movimentar(Guid itemEstoqueId, decimal quantidade, TipoMovimentacao tipo, Guid? usuarioId)
    {
        try
        {
            if (quantidade <= 0)
            {
                AddError("QuantidadeMovimento", "A quantidade de movimentação deve ser maior que zero.");
                throw new ValidationException(Errors);
            }

            if (_connection.State != ConnectionState.Open)
                _connection.Open();

            using var transaction = _connection.BeginTransaction();

            try
            {
                var item = await _repository.ObterParaAtualizacao(itemEstoqueId, transaction);

                if (item == null)
                    throw new NotFoundException("Item não encontrado.");

                decimal novaQuantidade = item.Quantidade;

                if (tipo == TipoMovimentacao.Acrescimo)
                {
                    novaQuantidade += quantidade;
                }
                else
                {
                    novaQuantidade -= quantidade;
                    if (novaQuantidade < 0)
                        throw new InvalidOperationException("Estoque insuficiente para realizar esta saída.");
                }

                await _repository.AtualizarQuantidade(itemEstoqueId, novaQuantidade, transaction);

                var historico = new Historico
                {
                    ItemEstoqueId = itemEstoqueId,
                    TipoMovimentacao = tipo,
                    UsuarioId = usuarioId,
                    QuantidadeAnterior = item.Quantidade,
                    QuantidadeResultante = novaQuantidade
                };
                await _historicoRepository.InserirComTransacao(historico, transaction);

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
        catch (InvalidOperationException)
        {
            throw;
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
            throw new Exception($"Erro ao movimentar estoque: {ex.Message}");
        }
    }

    public async Task<int> Excluir(Guid itemEstoqueId)
    {
        try
        {
            var affected = await _repository.Excluir(itemEstoqueId);

            if (affected <= 0) throw new NotFoundException("Item não encontrado com o ID informado.");

            return affected;
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao excluir item: {ex.Message}");
        }
    }

    public async Task<bool> Transferir(Guid itemEstoqueId, Guid? novoEspacoId, Guid usuarioId)
    {
        try
        {
            if (!novoEspacoId.HasValue || novoEspacoId.Value == Guid.Empty)
            {
                AddError("NovoEspacoId", "Informe o novo espaço de destino.");
                throw new ValidationException(Errors);
            }

            if (_connection.State != ConnectionState.Open)
                _connection.Open();

            using var transaction = _connection.BeginTransaction();

            try
            {
                var itemExistente = await _repository.ObterParaAtualizacao(itemEstoqueId, transaction);

                if (itemExistente == null)
                    throw new NotFoundException("Item de estoque não encontrado.");

                if (itemExistente.EspacoId == novoEspacoId.Value)
                {
                    AddError("NovoEspacoId", "O item já se encontra neste espaço.");
                    throw new ValidationException(Errors);
                }

                var affected = await _repository.TransferirEspaco(itemEstoqueId, novoEspacoId.Value, transaction);

                var historico = new Historico
                {
                    ItemEstoqueId = itemEstoqueId,
                    TipoMovimentacao = TipoMovimentacao.Transferencia,
                    UsuarioId = usuarioId,
                    EspacoOrigemId = itemExistente.EspacoId,
                    EspacoDestinoId = novoEspacoId.Value,
                    QuantidadeAnterior = itemExistente.Quantidade,
                    QuantidadeResultante = itemExistente.Quantidade
                };
                await _historicoRepository.InserirComTransacao(historico, transaction);

                transaction.Commit();
                return affected > 0;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
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
            throw new Exception($"Erro ao transferir item: {ex.Message}");
        }
    }

    private async Task ValidarCampos(ItemEstoque item, Guid itemEstoqueId)
    {
        item.Descricao = item.Descricao?.Trim() ?? string.Empty;

        if (itemEstoqueId == Guid.Empty && item.UnidadeOrganizacionalId == Guid.Empty)
            AddError(nameof(item.UnidadeOrganizacionalId), "Informe a unidade organizacional.");

        if (item.EspacoId == Guid.Empty)
            AddError(nameof(item.EspacoId), "Informe um espaço para o item.");

        if (string.IsNullOrWhiteSpace(item.Descricao))
            AddError(nameof(item.Descricao), "Informe a descrição do item.");
        else if (item.EspacoId != Guid.Empty)
        {
            bool existe = await _repository.VerificarItemExiste(item.Descricao, item.EspacoId, itemEstoqueId);

            if (existe)
                AddError(nameof(item.Descricao), "Já existe um item com esta descrição neste espaço.");
        }

        if (item.Quantidade < 0)
            AddError(nameof(item.Quantidade), "Informe a quantidade.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }

    public async Task<List<PizzaDashboardItem>> ObterPizzaDashboard(
    Guid unidadeOrganizacionalId,
    Guid? espacoId,
    int? tipoUnidadeMedida
)
    {
        try
        {
            return await _repository.ObterPizzaDashboard(unidadeOrganizacionalId, espacoId, tipoUnidadeMedida);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter dados do dashboard de pizza: {ex.Message}");
        }
    }
}