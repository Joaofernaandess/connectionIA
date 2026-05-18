export const extrairErro = async (response) => {
    try {
        const text = await response.text();
        if (!text) {
            return `Erro HTTP: ${response.status}`;
        }

        try {
            const data = JSON.parse(text);

            if (Array.isArray(data)) {
                return data.map(err => err.error).join(' | ');
            }

            if (data.mensagem) {
                return data.mensagem;
            }

            return text;
        } catch (e) {
            return text;
        }
    } catch (error) {
        return 'Erro ao ler a resposta do servidor.';
    }
};