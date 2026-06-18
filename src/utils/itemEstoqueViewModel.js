import { TIPO_UNIDADE } from '../constants/tipoUnidade';
import { parseQuantity } from './quantity';

export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

const getDataCadastro = (item) => (
    item.dataCadastro ||
    item.dataCriacao ||
    item.criadoEm ||
    item.createdAt ||
    item.dataHoraCadastro ||
    ''
);

export const ordenarItensEstoque = (lista) => [...lista].sort((a, b) => {
    const espacoCompare = String(a.espacoId || '').localeCompare(String(b.espacoId || ''));
    if (espacoCompare !== 0) return espacoCompare;

    const dataA = new Date(getDataCadastro(a)).getTime() || 0;
    const dataB = new Date(getDataCadastro(b)).getTime() || 0;
    return dataB - dataA;
});

export const filtrarItensEstoque = (lista, termo, listaEspacos) => {
    const termoNormalizado = termo.trim().toLowerCase();
    if (!termoNormalizado) return lista;

    return lista.filter(item => {
        const espaco = listaEspacos.find(e => e.espacoId === item.espacoId);
        return [
            item.descricao,
            item.espacoId,
            espaco?.nome,
            espaco?.descricao,
            TIPO_UNIDADE[item.tipoUnidadeMedida]
        ].some(valor => String(valor || '').toLowerCase().includes(termoNormalizado));
    });
};

export const criarPayloadItemEstoque = ({ unidadeOrganizacionalId, formData, quantidadePadraoZero = false }) => ({
    unidadeOrganizacionalId,
    espacoId: formData.espacoId === '' ? EMPTY_GUID : formData.espacoId,
    descricao: formData.descricao,
    tipoUnidadeMedida: parseInt(formData.tipoUnidadeMedida),
    quantidade: quantidadePadraoZero && formData.quantidade === '' ? 0 : parseQuantity(formData.quantidade)
});

export const criarPayloadMovimentacao = ({ movimentacaoData, usuarioId }) => ({
    quantidadeMovimento: parseQuantity(movimentacaoData.quantidadeMovimento),
    tipoMovimentacao: parseInt(movimentacaoData.tipoMovimentacao),
    usuarioId: usuarioId || EMPTY_GUID
});
