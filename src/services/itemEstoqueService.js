import { getBaseUrl } from '../utils/apiConfig';
import { encryptedFetch } from '../utils/payloadCrypto';
import { authHeaders } from './httpHeaders';

export const listarItensEstoque = ({ token, unidadeOrganizacionalId, filtro = '', skip = 0, top = 50 }) => {
    const params = new URLSearchParams({
        unidadeOrganizacionalId,
        skip: String(skip),
        top: String(top)
    });

    if (filtro.trim()) {
        params.set('filtro', filtro.trim());
    }

    return fetch(`${getBaseUrl()}/v1/itens-estoque?${params.toString()}`, {
        headers: authHeaders(token)
    });
};

export const listarHistoricoItem = ({ token, itemEstoqueId }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}/historico`, {
        headers: authHeaders(token)
    })
);

export const obterItemEstoque = ({ token, itemEstoqueId }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        headers: authHeaders(token)
    })
);

export const criarItemEstoque = ({ token, payload }) => (
    encryptedFetch(`${getBaseUrl()}/v1/itens-estoque`, {
        method: 'POST',
        headers: authHeaders(token),
        payload
    })
);

export const atualizarItemEstoque = ({ token, itemEstoqueId, payload }) => (
    encryptedFetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        payload
    })
);

export const excluirItemEstoque = ({ token, itemEstoqueId }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
    })
);

export const transferirItemEstoque = ({ token, itemEstoqueId, novoEspacoId, usuarioId }) => (
    encryptedFetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}/transferir`, {
        method: 'PATCH',
        headers: authHeaders(token),
        payload: { novoEspacoId: novoEspacoId || null, usuarioId }
    })
);

export const movimentarItemEstoque = ({ token, itemEstoqueId, payload }) => (
    encryptedFetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        payload
    })
);
