import { getBaseUrl } from '../utils/apiConfig';
import { authHeaders, jsonHeaders } from './httpHeaders';

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
    fetch(`${getBaseUrl()}/v1/itens-estoque`, {
        method: 'POST',
        headers: jsonHeaders(token),
        body: JSON.stringify(payload)
    })
);

export const atualizarItemEstoque = ({ token, itemEstoqueId, payload }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        method: 'PUT',
        headers: jsonHeaders(token),
        body: JSON.stringify(payload)
    })
);

export const excluirItemEstoque = ({ token, itemEstoqueId }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
    })
);

export const transferirItemEstoque = ({ token, itemEstoqueId, novoEspacoId, usuarioId }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}/transferir`, {
        method: 'PATCH',
        headers: jsonHeaders(token),
        body: JSON.stringify({ novoEspacoId, usuarioId })
    })
);

export const movimentarItemEstoque = ({ token, itemEstoqueId, payload }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque/${itemEstoqueId}`, {
        method: 'PATCH',
        headers: jsonHeaders(token),
        body: JSON.stringify(payload)
    })
);