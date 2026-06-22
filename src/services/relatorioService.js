// src/services/relatorioService.js
import { getBaseUrl } from '../utils/apiConfig';
import { authHeaders } from './httpHeaders';

/**
 * Chama GET /v1/relatorios/itens-estoque/pizza
 * @param {Object} args
 * @param {string} args.token
 * @param {string} args.unidadeOrganizacionalId
 * @param {string=} args.espacoId
 * @param {number=} args.tipoUnidadeMedida
 */
export const obterPizzaDashboard = ({
  token,
  unidadeOrganizacionalId,
  espacoId,
  tipoUnidadeMedida,
}) => {
  const params = new URLSearchParams({
    unidadeOrganizacionalId,
  });

  if (espacoId) {
    params.set('espacoId', espacoId);
  }

  if (tipoUnidadeMedida != null && tipoUnidadeMedida !== '') {
    params.set('tipoUnidadeMedida', String(tipoUnidadeMedida));
  }

  return fetch(`${getBaseUrl()}/v1/relatorios/itens-estoque/pizza?${params.toString()}`, {
    headers: authHeaders(token),
  });
};