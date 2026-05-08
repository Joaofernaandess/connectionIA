async function apiGetAtendimentos(data, loading) {
    let params = "";

    if (data && data.id)
        params += (params ? "&" : "?") + `id=${data.id}`;

    if (data && data.paginaInicio)
        params += (params ? "&" : "?") + `paginaInicio=${data.paginaInicio}`;

    if (data && data.paginaFim)
        params += (params ? "&" : "?") + `paginaFim=${data.paginaFim}`;

    if (data && data.equipe)
        params += (params ? "&" : "?") + `equipe=${data.equipe}`;

    if (data && data.departamento)
        params += (params ? "&" : "?") + `departamento=${data.departamento}`;

    if (data && data.atendente)
        params += (params ? "&" : "?") + `atendente=${data.atendente}`;

    if (data && data.canal)
        params += (params ? "&" : "?") + `canal=${data.canal}`;

    if (data && data.contato)
        params += (params ? "&" : "?") + `contato=${data.contato}`;

    if (data && data.atendimentoInicial)
        params += (params ? "&" : "?") + `atendimentoInicial=${data.atendimentoInicial}`;

    if (data && data.atendimentoFinal)
        params += (params ? "&" : "?") + `atendimentoFinal=${data.atendimentoFinal}`;

    if (data && data.pendente)
        params += (params ? "&" : "?") + `pendente=${data.pendente}`;

    if (data && data.aguardando)
        params += (params ? "&" : "?") + `aguardando=${data.aguardando}`;

    if (data && data.atendendo)
        params += (params ? "&" : "?") + `atendendo=${data.atendendo}`;

    if (data && data.finalizado)
        params += (params ? "&" : "?") + `finalizado=${data.finalizado}`;

    return await apiGetDefault("atendimentos", params, loading);
}

async function apiGetDepartamentos(atendenteId, equipeId) {
    return await apiGetDefault("departamentos",
        `?atendenteId=${atendenteId}&equipeId=${equipeId}`, false);
}

async function apiGetEquipes(atendenteId, departamentoId) {
    return await apiGetDefault("equipes",
        `?atendenteId=${atendenteId}&departamentoId=${departamentoId}`, false);
}

async function apiGetAtendentes(equipeId, departamentoId) {
    return await apiGetDefault("atendentes",
        `?equipeId=${equipeId}&departamentoId=${departamentoId}`, false);
}

async function apiGetCanais() {
    return await apiGetDefault("canais", "", false);
}

async function apiGetAtendimento(id) {
    return await apiGetDefault(`atendimentos/${id}`, "", false);
}

async function apiGetContatosNotificacaoAtiva() {
    return await apiGetDefault(`notificacaoAtiva/contatos`, "", false);
}

async function apiGetModelosNotificacaoAtiva(comParametros) {
    return await apiGetDefault(`notificacaoAtiva/modelo?comParametros=${comParametros}`, "", false);
}

async function apiGetModeloNotificacaoAtiva(id, comParametros = true) {
    return await apiGetDefault(`notificacaoAtiva/modelo?id=${id}&comParametros=${comParametros}`, "", false);
}

async function apiGetAtendimentoFinalizar(atendimentoId) {
    return await apiGetDefault(`atendimentos/${atendimentoId}/finalizar`, "", false);
}

async function apiPostAtender(atendimentoId, contatoId) {
    return await apiPostDefault(`atendimentos/${atendimentoId}/atender`, {
        contatoId
    });
}

async function apiPostTransferir(atendimentoId, equipeId, departamentoId, atendenteId) {
    return await apiPostDefault(`atendimentos/${atendimentoId}/transferir`, {
        equipeId,
        departamentoId,
        atendenteId
    });
}

async function apiPostEnviarMensagem(mensagem) {
    return await apiPostDefault(`atendimentos/${getAtendimentoId()}/mensagem/texto`, {
        conteudo: mensagem
    }, false);
}

async function apiPostEnviarNotificacaoAtiva(request) {
    return await apiPostDefault(`notificacaoAtiva/whatsapp`, {request});
}

async function apiGetPermissoesAtendenteNotificacaoAtiva() {
    return await apiGetDefault(`notificacaoAtiva/atendente/permissoes`, "", false);
}

async function apiPostEnviarArquivo(arquivo) {
    return await apiPostFileDefault(`atendimentos/${getAtendimentoId()}/mensagem/arquivo`, arquivo);
}

async function apiPostEnviarAudio(arquivo, nome) {
    return await apiPostAudioDefault(`atendimentos/${getAtendimentoId()}/mensagem/audio`, arquivo, nome);
}

async function apiPutAtualizaContato(contato) {
    return await apiPutDefault(`contatos`, contato);
}

// DEFAULT
async function apiGetDefault(route, params = "", loading = true) {
    var resp = null;

    if (loading) loadingTopOpen("", false);

    try {
        resp = await axios({
            method: 'get',
            url: `/${route}${params}`,
            headers: {
                atendente: JSON.stringify(getAtendenteStorage())
            },
            timeout: timeOutApi
        }).catch(function (error) {
            if (error.response) {
                return error.response;
            } else if (error.request) {
                return error.request;
            } else {
                return error.message;
            }
        });
    } catch (error) {
        alertError(error);
    } finally {
        if (loading) loadingTopClose();
    }

    return resp;
}

async function apiPostDefault(route, data, loading) {
    let resp = null;

    if (loading) loadingTopOpen();

    try {
        resp = await axios({
            method: 'post',
            url: `/${route}`,
            headers: {
                atendente: JSON.stringify(getAtendenteStorage())
            },
            data: data,
            timeout: timeOutApi
        });
    } catch (error) {
        if (error.response) alertError(error.response.data.message);
        else alertError(error);
    } finally {
        if (loading) loadingTopClose();
    }

    return resp;
}

async function apiPutDefault(route, data) {
    let resp = null;

    loadingTopOpen();

    try {
        resp = await axios({
            method: 'put',
            url: `/${route}`,
            headers: {
                atendente: JSON.stringify(getAtendenteStorage())
            },
            data: data,
            timeout: timeOutApi
        });
    } catch (error) {
        alertError(error);
    } finally {
        loadingTopClose();
    }

    return resp;
}

async function apiPostFileDefault(route, file) {
    let resp = null;

    loadingTopOpen();

    let formData = new FormData();
    formData.append("file", file);

    try {
        resp = await axios({
            method: 'post',
            url: `/${route}`,
            headers: {
                atendente: JSON.stringify(getAtendenteStorage())
            },
            data: formData,
            timeout: timeOutApi
        });
    } catch (error) {
        alertError(error);
    } finally {
        loadingTopClose();
    }

    return resp;
}

async function apiPostAudioDefault(route, blob, fileName) {
    let resp = null;

    loadingTopOpen();

    let formData = new FormData();
    formData.append("file", blob, fileName);

    try {
        resp = await axios({
            method: 'post',
            url: `/${route}`,
            headers: {
                atendente: JSON.stringify(getAtendenteStorage())
            },
            data: formData,
            timeout: timeOutApi
        });
    } catch (error) {
        alertError(error);
    } finally {
        loadingTopClose();
    }

    return resp;
}