import { getBaseUrl } from '../utils/apiConfig';
import { encryptedFetch } from '../utils/payloadCrypto';
import { authHeaders } from './httpHeaders';

export const listarEspacos = ({ token, unidadeOrganizacionalId, skip = 0, top = 50 }) => (
    fetch(`${getBaseUrl()}/v1/espacos?unidadeOrganizacionalId=${unidadeOrganizacionalId}&skip=${skip}&top=${top}`, {
        headers: authHeaders(token)
    })
);

export const obterEspaco = ({ token, espacoId }) => (
    fetch(`${getBaseUrl()}/v1/espacos/${espacoId}`, {
        headers: authHeaders(token)
    })
);

export const criarEspaco = ({ token, payload }) => (
    encryptedFetch(`${getBaseUrl()}/v1/espacos`, {
        method: 'POST',
        headers: authHeaders(token),
        payload
    })
);

export const atualizarEspaco = ({ token, espacoId, payload }) => (
    encryptedFetch(`${getBaseUrl()}/v1/espacos/${espacoId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        payload
    })
);

export const excluirEspaco = ({ token, espacoId }) => (
    fetch(`${getBaseUrl()}/v1/espacos/${espacoId}`, {
        method: 'DELETE',
        headers: authHeaders(token)
    })
);

export const listarItensDoEspaco = ({ token, espacoId, top = 50 }) => (
    fetch(`${getBaseUrl()}/v1/itens-estoque?espacoId=${espacoId}&top=${top}`, {
        headers: authHeaders(token)
    })
);