using Pedido.Domain.Exceptions;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Models;

namespace Pedido.Domain.Services;

public class MateriaPrimaService : BaseService
{
    private readonly IMateriaPrimaRepository _materiaPrimaRepository;

    public MateriaPrimaService(IMateriaPrimaRepository materiaPrimaRepository)
    {
        _materiaPrimaRepository = materiaPrimaRepository;
    }

    public async Task<MateriaPrimaPostResponse> Cadastrar(MateriaPrimaPostRequest request)
    {
        try
        {
            ValidarCampos(request);

            var materiaPrima = new MateriaPrima
            {
                MateriaPrimaId = Guid.NewGuid(),
                Descricao = request.Descricao.Trim(),
                Unidade = request.Unidade,
                Estoque = request.Estoque,
                Preco = request.Preco
            };

            var materiaPrimaId = await _materiaPrimaRepository.Cadastrar(materiaPrima);

            return new MateriaPrimaPostResponse
            {
                MateriaPrimaId = materiaPrimaId,
                Descricao = materiaPrima.Descricao,
                Unidade = materiaPrima.Unidade,
                Estoque = materiaPrima.Estoque,
                Preco = materiaPrima.Preco
            };
        }
        catch (ValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao cadastrar matéria-prima: {ex.Message}");
        }
    }

    public async Task<List<MateriaPrimaGetResponse>> Obter(MateriaPrimaGetRequest request)
    {
        try
        {
            return await _materiaPrimaRepository.Obter(request);
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao obter matérias-primas: {ex.Message}");
        }
    }

    private void ValidarCampos(MateriaPrimaPostRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Descricao))
            AddError(nameof(MateriaPrima.Descricao), "Informe a descrição.");

        if (!Enum.IsDefined(typeof(UnidadeMateriaPrima), request.Unidade))
            AddError(nameof(MateriaPrima.Unidade), "Informe uma unidade válida.");

        if (request.Estoque <= 0)
            AddError(nameof(MateriaPrima.Estoque), "Informe um estoque maior que zero.");

        if (request.Preco <= 0)
            AddError(nameof(MateriaPrima.Preco), "Informe um preço maior que zero.");

        if (Errors.Any())
            throw new ValidationException(Errors);
    }
}