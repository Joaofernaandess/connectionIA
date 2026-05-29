const obterValor = (objeto, ...chaves) => {
    if (!objeto || typeof objeto !== 'object') return '';

    for (const chave of chaves) {
        if (typeof objeto[chave] === 'string' && objeto[chave].trim()) {
            return objeto[chave];
        }
    }

    return '';
};

const normalizarCampo = (campo) => {
    if (!campo) return '';

    const limpo = String(campo).replace('$.', '');
    return limpo.charAt(0).toUpperCase() + limpo.slice(1);
};

const extrairMensagemHeader = (response) => {
    const mensagem = response.headers.get('X-Zenite-Message');
    if (!mensagem) return '';

    try {
        return decodeURIComponent(mensagem);
    } catch (error) {
        return mensagem;
    }
};

export const lerRespostaApi = async (response) => {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch (error) {
        return text;
    }
};

export const extrairMensagemDados = (dados) => {
    if (!dados) return '';

    if (typeof dados === 'string') {
        return dados;
    }

    if (Array.isArray(dados)) {
        return dados
            .map(item => extrairMensagemDados(item))
            .filter(Boolean)
            .join(' | ');
    }

    if (typeof dados !== 'object') return '';

    const mensagemDireta = obterValor(
        dados,
        'mensagem',
        'Mensagem',
        'message',
        'Message',
        'erro',
        'Erro',
        'error',
        'Error',
        'detail',
        'Detail',
        'title',
        'Title'
    );

    if (mensagemDireta) return mensagemDireta;

    if (dados.errors && typeof dados.errors === 'object') {
        return Object.values(dados.errors)
            .flat()
            .filter(Boolean)
            .join(' | ');
    }

    return '';
};

export const extrairErrosCamposDados = (dados) => {
    const mappedErrors = {};

    const adicionarErro = (campo, mensagem) => {
        const campoNormalizado = normalizarCampo(campo);
        if (campoNormalizado && mensagem) {
            mappedErrors[campoNormalizado] = mensagem;
        }
    };

    if (Array.isArray(dados)) {
        dados.forEach(err => {
            adicionarErro(
                err?.field || err?.Field || err?.campo || err?.Campo,
                err?.error || err?.Error || err?.mensagem || err?.Mensagem || err?.message || err?.Message
            );
        });
    } else if (dados?.errors && typeof dados.errors === 'object') {
        Object.keys(dados.errors).forEach(key => {
            const mensagens = Array.isArray(dados.errors[key])
                ? dados.errors[key]
                : [dados.errors[key]];

            adicionarErro(key, mensagens.filter(Boolean).join(' | '));
        });
    }

    return mappedErrors;
};

export const extrairMensagem = async (response) => {
    try {
        return extrairMensagemDados(await lerRespostaApi(response)) || extrairMensagemHeader(response);
    } catch (error) {
        return '';
    }
};

export const extrairErro = extrairMensagem;

export const extrairErrosCampos = async (response) => {
    try {
        const dados = await lerRespostaApi(response);
        return {
            fieldErrors: extrairErrosCamposDados(dados),
            message: extrairMensagemDados(dados)
        };
    } catch (error) {
        return {
            fieldErrors: {},
            message: ''
        };
    }
};

export const aplicarErrosCampos = async (response, setFieldErrors, setErro) => {
    const { fieldErrors, message } = await extrairErrosCampos(response);
    setFieldErrors(fieldErrors);

    if (Object.keys(fieldErrors).length === 0 && message) {
        setErro(message);
    }
};