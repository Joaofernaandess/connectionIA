export const filtrarEspacos = (espacos, pesquisa) => (
    espacos.filter(espaco =>
        espaco.nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
        espaco.descricao?.toLowerCase().includes(pesquisa.toLowerCase())
    )
);

export const criarPayloadEspaco = ({ unidadeOrganizacionalId, formData }) => ({
    unidadeOrganizacionalId,
    nome: formData.nome,
    descricao: formData.descricao
});