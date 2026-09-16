using Microsoft.Extensions.Caching.Memory;
using Pedido.Domain.Interfaces;
using System.Security.Cryptography;

namespace Pedido.Infra.Services;

public class PedidoArquivoTokenService : IPedidoArquivoTokenService
{
    private readonly IMemoryCache _memoryCache;

    public PedidoArquivoTokenService(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public (string Token, DateTime ExpiraEm) Gerar(Guid pedidoId, int expiracaoSegundos)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var expiraEm = DateTime.UtcNow.AddSeconds(expiracaoSegundos);

        _memoryCache.Set(MontarCacheKey(token), pedidoId, TimeSpan.FromSeconds(expiracaoSegundos));

        return (token, expiraEm);
    }

    public bool Validar(Guid pedidoId, string token)
    {
        return !string.IsNullOrWhiteSpace(token) &&
            _memoryCache.TryGetValue(MontarCacheKey(token), out Guid pedidoTokenId) &&
            pedidoTokenId == pedidoId;
    }

    private static string MontarCacheKey(string token)
    {
        return $"pedido-arquivo-token:{token}";
    }
}
