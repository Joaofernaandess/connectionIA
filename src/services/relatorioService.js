import { getBaseUrl } from '../utils/apiConfig';
import { authHeaders } from './httpHeaders';

export const obterPizzaDashboard = ({
  token,
  unidadeOrganizacionalId,
  espacoId,
  tipoUnidadeMedida
}) => {
  const params = new URLSearchParams({
    unidadeOrganizacionalId,
  });

  if (espacoId) {
    params.set('espacoId', espacoId);
  }

  if (Number.isInteger(tipoUnidadeMedida)) {
    params.set('tipoUnidadeMedida', String(tipoUnidadeMedida));
  }

  return fetch(`${getBaseUrl()}/v1/relatorios/itens-estoque/pizza?${params.toString()}`, {
    headers: authHeaders(token),
  });
};