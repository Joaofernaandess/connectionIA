var socket;
// Store pasted image file until user confirms send
var clipboardImageFile = null;

var unreadNotifications = 0;
var defaultTitle = document.title;

function updateBrowserTitle() {
    if (unreadNotifications > 0) {
        document.title = `(${unreadNotifications}) ${defaultTitle}`;
    } else {
        document.title = defaultTitle;
    }
}

function incrementUnreadNotifications() {
    unreadNotifications++;
    updateBrowserTitle();
}

function decrementUnreadNotifications() {
    if (unreadNotifications > 0) {
        unreadNotifications--;
        updateBrowserTitle();
    }
}

function resetUnreadNotifications() {
    unreadNotifications = 0;
    updateBrowserTitle();
}

window.addEventListener('focus', resetUnreadNotifications);

async function homeOnLoad() {
    moment.locale("pt-br");
    setNomeUsuarioNavbar();

    setInits();
    handleMobileLayout();
    $(window).on('resize', handleMobileLayout);

    await setNotificacaoAtivaModalBtn();
    await getFiltros();
    await setFilter();

    await getAtendimentos({
        iniciarNaPagina1: true,
        fecharAtendimentoAberto: true,
        resetAtendimentoPagina: false
    });
}


function setNomeUsuarioNavbar() {
    const usuario = getUsuario();
    const atendenteBlip = getAtendenteStorage();

    if (usuario && usuario.Nome.length > 0) {
        $("#dropdownUser").html(`
            ${getContatoImg(atendenteBlip.urlFoto, "user-photo", 35)}
            
            ${usuario.Nome}
        `);
    }
}

function setInits() {
    setAutoSizeTextArea();
    setEmojiPicker();
    setChat();
    setNotify();
    setPasteImageListener();
}

function setAutoSizeTextArea() {
    var textarea = document.querySelector('textarea');
    textarea.addEventListener('keydown', autosize);
}

function autosize(el) {
    if (!el)
        el = this;

    setTimeout(function () {

        if (el.scrollHeight <= 120 &&
            el.scrollHeight > 40) {
            el.style.cssText = 'height:auto; padding:0';
            el.style.cssText = '-moz-box-sizing:content-box';
            el.style.cssText = 'height:' + el.scrollHeight + 'px;';
        }
    }, 0);
}

function setEmojiPicker() {
    const button = document.querySelector(".emoji-button");
    const input = document.querySelector("#chatText");
    const picker = new EmojiButton({
        position: 'auto',
        autoHide: 'false',
        categories: ['smileys', 'people', 'animals', 'food', 'activities', 'travel', 'objects', 'symbols', 'flags'],
        style: 'twemoji',
        i18n: {
            search: 'Buscar...',
            categories: {
                recents: 'Recentes',
                smileys: 'Sorrisos & Emoções',
                people: 'Pessoas',
                animals: 'Animais & Natureza',
                food: 'Comida e Bebida',
                activities: 'Atividades',
                travel: 'Viagens e Lugares',
                objects: 'Objetos',
                symbols: 'Símbolos',
                flags: 'Bandeiras',
                custom: 'Customizados'
            },
            notFound: 'Nenhum emoji encontrado'
        }
    });

    picker.on('emoji', function (emoji) {
        input.focus();

        let posInit = 0;
        let posFocus = input.selectionStart;
        let posFinal = input.value.length;
        let value = input.value;

        if (posFocus < posFinal) {
            input.value = value.substring(posInit, posFocus);
            input.value += emoji;
            input.value += value.substring(posFocus, posFinal);

            input.setSelectionRange(posFocus + 1, posFocus + 1);
        } else {
            input.value += emoji;
        }

        textChatOnKeyUp(null);
    });

    button.addEventListener('click', function () {
        picker.pickerVisible ? picker.hidePicker() : picker.showPicker(input)
    });
}

function showFilter() {
    $("#modalFilter").modal("show");
}

async function setNotificacaoAtivaModalBtn() {
    const permissoesAtendente = await getPermissoesNotificacaoAtiva();
    if (permissoesAtendente && permissoesAtendente.podeEnviarNotificacaoAtiva) {
        $("#notificacaoAtivaBtn").show();
        $("#notificacaoAtivaBtn").disabled = false;
    } else {
        $("#notificacaoAtivaBtn").hide();
        $("#notificacaoAtivaBtn").disabled = true;
    }
}

async function getPermissoesNotificacaoAtiva() {
    const permissoesAtendente = await apiGetPermissoesAtendenteNotificacaoAtiva();

    if (permissoesAtendente &&
        permissoesAtendente.data &&
        permissoesAtendente.data.permissoes) {
        return permissoesAtendente.data.permissoes
    } else {
        return null;
    }
}

async function showNovoAtendimento() {
    const permissoesAtendente = await getPermissoesNotificacaoAtiva();
    if (permissoesAtendente &&
        permissoesAtendente.podeEnviarNotificacaoAtiva) {
        const podeEnviarNotificacaoAtiva = permissoesAtendente.podeEnviarNotificacaoAtiva;
        if (!podeEnviarNotificacaoAtiva) {
            alertError("Você não tem permissão para criar um novo atendimento!");
            return;
        }
    } else {
        alertError("Você não tem permissão para criar um novo atendimento!");
        return;
    }

    sessionStorage.removeItem("contatos_not_ativa");
    sessionStorage.removeItem("modelos_not_ativa");
    sessionStorage.removeItem("parametros_not_ativa");
    sessionStorage.removeItem("not_ativa_novo_contato");
    sessionStorage.removeItem("eh_not_ativa_novo_contato");

    limpaParametrosModeloNotAtiva();

    await getFiltrosModalNotificaoAtiva();
    $('#modalEnvioAtivoMsg').off('hidden.bs.modal').on('hidden.bs.modal', function () {
        sessionStorage.removeItem("contatos_not_ativa");
        sessionStorage.removeItem("modelos_not_ativa");
        sessionStorage.removeItem("parametros_not_ativa");
        sessionStorage.removeItem("not_ativa_novo_contato");
        sessionStorage.removeItem("eh_not_ativa_novo_contato");
        sessionStorage.removeItem("pdf_not_ativa");

        $("#selectContatosModalNotAtiva").val("");
        limparNovoContatoNotificacaoAtiva();
        limpaParametrosModeloNotAtiva();

        $("#selectContatosModalNotAtiva").val("");
        $("#inputWhatsAppContatoNotAtiva").attr("disabled", true);
        $("#inputCidadeContatoNotAtiva").attr("disabled", true);
        $("#inputEmpresaContatoNotAtiva").attr("disabled", true);
        $("#inputNomeContatoNotAtiva").val("");
        $("#inputWhatsAppContatoNotAtiva").val("");
        $("#inputCidadeContatoNotAtiva").val("");
        $("#inputEmpresaContatoNotAtiva").val("");
        $("#nomeContatoNotAtivaDiv").hide();
        $("#selectContatosModalEnvioMsgAtiva").show();
    })

    setMask();
    $("#modalEnvioAtivoMsg").modal("show");
}

function limpaParametrosModeloNotAtiva() {
    $("#selectModelosModalNotAtiva").val("");
    $("#selectModelosModalNotAtiva").attr("disabled", true);
    $("#parametrosNotAtiva").empty();
    $("#parametrosNotAtiva").hide();
    $("#modeloConteudoNotAtiva").empty();
    $("#modeloConteudoNotAtiva").hide();
    $("#pdfUploadNotAtiva").hide();
    
    sessionStorage.removeItem("parametros_not_ativa");
    removerPdfAnexado(false);
}

function novoContatoNotificacaoAtiva() {
    const selectContatoDiv = $("#selectContatosModalEnvioMsgAtiva");
    const nomeContatoNotAtivaDiv = $("#nomeContatoNotAtivaDiv");
    const inputNomeContato = $("#inputNomeContatoNotAtiva");

    if (selectContatoDiv.is(":visible")) {
        $("#selectContatosModalNotAtiva").val("");
        limpaParametrosModeloNotAtiva();
        limparNovoContatoNotificacaoAtiva();
        sessionStorage.setItem("eh_not_ativa_novo_contato", "true");
        inputNomeContato.val("");
        $("#inputWhatsAppContatoNotAtiva").attr("disabled", false);
        $("#inputCidadeContatoNotAtiva").attr("disabled", false);
        $("#inputEmpresaContatoNotAtiva").attr("disabled", false);
        selectContatoDiv.hide();
        nomeContatoNotAtivaDiv.show();
    }
}

function cancelarNovoContatoNotificacaoAtiva() {
    const selectContatoDiv = $("#selectContatosModalEnvioMsgAtiva");
    const nomeContatoNotAtivaDiv = $("#nomeContatoNotAtivaDiv");
    const inputNomeContato = $("#inputNomeContatoNotAtiva");
    //const novoContatoForm = $("#novoContatoModalEnvioMsgAtiva");

    if (nomeContatoNotAtivaDiv.is(":visible")) {
        $("#selectContatosModalNotAtiva").val("");
        limpaParametrosModeloNotAtiva();
        limparNovoContatoNotificacaoAtiva();
        sessionStorage.removeItem("not_ativa_novo_contato");
        inputNomeContato.val("");
        $("#inputWhatsAppContatoNotAtiva").attr("disabled", true);
        $("#inputCidadeContatoNotAtiva").attr("disabled", true);
        $("#inputEmpresaContatoNotAtiva").attr("disabled", true);
        nomeContatoNotAtivaDiv.hide();
        selectContatoDiv.show();
    }
}

function limparNovoContatoNotificacaoAtiva() {
    const inputNomeContato = $("#inputNomeContatoNotAtiva");
    const inputWhatsappContato = $("#inputWhatsAppContatoNotAtiva");
    const inputCidadeContato = $("#inputCidadeContatoNotAtiva");
    const inputEmpresaContato = $("#inputEmpresaContatoNotAtiva");

    inputNomeContato.val("");
    inputWhatsappContato.val("");
    inputCidadeContato.val("");
    inputEmpresaContato.val("");

    sessionStorage.removeItem("not_ativa_novo_contato");
    sessionStorage.removeItem("eh_not_ativa_novo_contato");
}

function inputNovoContatoOnChange() {
    const inputNomeContato = $("#inputNomeContatoNotAtiva");
    const inputWhatsappContato = $("#inputWhatsAppContatoNotAtiva");
    const inputCidadeContato = $("#inputCidadeContatoNotAtiva");
    const inputEmpresaContato = $("#inputEmpresaContatoNotAtiva");

    const novoContato = {
        nome: inputNomeContato.val(),
        whatsapp: inputWhatsappContato.val(),
        cidade: inputCidadeContato.val(),
        empresa: inputEmpresaContato.val()
    }

    sessionStorage.setItem("not_ativa_novo_contato", JSON.stringify(novoContato));

    const parametrosDiv = $("#parametrosNotAtiva");

    if (parametrosDiv.is(":visible")) {
        if (!novoContato.nome || !novoContato.whatsapp) {
            limpaParametrosModeloNotAtiva();
            return;
        }

        const parametrosStorage = JSON.parse(sessionStorage.getItem("parametros_not_ativa"));
        const nomeParametro = parametrosStorage.find(p => p.propriedade === 1);
        nomeParametro ? nomeParametro.valor = novoContato.nome : null;
        const cidadeParametro = parametrosStorage.find(p => p.propriedade === 2);
        cidadeParametro ? cidadeParametro.valor = novoContato.cidade : null;
        const whatsappParametro = parametrosStorage.find(p => p.propriedade === 3)
        whatsappParametro ? whatsappParametro.valor = novoContato.whatsapp : null;
        const empresaParametro = parametrosStorage.find(p => p.propriedade === 4);
        empresaParametro ? empresaParametro.valor = novoContato.empresa : null;
        sessionStorage.setItem("parametros_not_ativa", JSON.stringify(parametrosStorage));
        $("#modeloConteudoNotAtiva");
        parametrosStorage.forEach(parametro => {
            const parametroInput = $(`#inputParametro${parametro.ordem}`);
            parametroInput.val(parametro.valor);
            updateConteudoModeloNotificacaoAtiva(parametro);
        });
    }

    if (novoContato.nome.length > 0 && novoContato.whatsapp.length > 0) {
        $("#selectModelosModalNotAtiva").attr("disabled", false);
    }
}

async function enviarNotificacaoAtiva() {
    await enviarNotificacaoAtivaProcess();
}

async function enviarNotificacaoAtivaProcess() {
    const contato = document.querySelector(`#selectContatosModalNotAtiva`).data;
    const contatoId = contato ? contato.id : 0;
    const modeloId = getIdSelect("#selectModelosModalNotAtiva");
    const parametrosStorage = JSON.parse(sessionStorage.getItem("parametros_not_ativa"));
    
    // Validação do anexo se o modelo exigir (tipo diferente de 1 = texto)
    const modelos = JSON.parse(sessionStorage.getItem("modelos_not_ativa") || "[]");
    const modeloSelecionado = modelos.find(m => m.id === modeloId);

    if (modeloSelecionado && modeloSelecionado.tipo > 1) {
        const pdfAnexado = pdfFileData || sessionStorage.getItem('pdf_not_ativa');
        if (!pdfAnexado) {
            const tipoAnexo = getNomeTipoAnexo(modeloSelecionado.tipo);
            alertError(`Este modelo exige um arquivo ${tipoAnexo} anexado. Por favor, anexe o arquivo antes de continuar.`);
            return;
        }
    }

    const params = parametrosStorage.map(p => {
        return {
            parametroId: p.id,
            nome: p.nome,
            tipo: 1,
            valor: p.valor
        }
    });

    for (const p of params) {
        if (!p.valor) {
            erro = true;
            alertError(`O parâmetro <b>${p.nome}</b> não foi preenchido! Preencha todos os parâmetros para criar o novo atendimento.`)
            return;
        }
    }

    const request = {};
    const ehNovoContato = sessionStorage.getItem("eh_not_ativa_novo_contato") === "true";
    if (ehNovoContato) {
        request.contato = JSON.parse(sessionStorage.getItem("not_ativa_novo_contato"));
    } else {
        request.contatoId = contatoId;
    }

    request.modeloId = modeloId;
    request.params = params;

    // Inclui o PDF no request se existir
    const pdfAnexado = pdfFileData || sessionStorage.getItem('pdf_not_ativa');
    if (pdfAnexado) {
        request.pdfBase64 = pdfAnexado;
        // Envia o nome original do arquivo
        const inputArquivo = document.getElementById('inputPdfNotAtiva');
        if (inputArquivo && inputArquivo.files && inputArquivo.files.length > 0) {
            request.pdfFileName = inputArquivo.files[0].name;
        }
    }

    if ((request.contatoId > 0 || request.contato) && modeloId > 0) {
        apiPostEnviarNotificacaoAtiva(request).then(async response => {
            if (response && response.status === 200) {
                getAlert("info", "Novo atendimento criado com sucesso!", 5000);
                await getAtendimentos({}, true);
                $("#modalEnvioAtivoMsg").modal("hide");
            }
        }).catch(error => {
            alertError(error)
            console.log(error);
        })
    }
}

async function getFiltros() {
    await selectAtendentes(0, 0);
    await selectEquipes(0, 0,);
    await selectDepartamentos(0, 0);
    await selectCanais();
}

async function getFiltrosModalNotificaoAtiva() {
    await selectContatosNotificacaoAtiva(0);
    await selectModelosNotificacaoAtiva(0);
}

async function selectContatosNotificacaoAtiva(contatoId) {
    const res = await apiGetContatosNotificacaoAtiva(contatoId);
    if (res) {
        sessionStorage.setItem("contatos_not_ativa", JSON.stringify(res.data.contatos));
        const contatos = res.data.contatos.map(x => {
            const empresa = x.empresa ? `${x.empresa} - ` : "";
            return { id: x.id, description: `${empresa}${x.nome} (${x.whatsapp})` };
        });
        const contatosOrdenados = contatos.sort((a, b) => a.description.localeCompare(b.description));
        autocomplete(document.getElementById("selectContatosModalNotAtiva"), contatosOrdenados ?? [], selectContatoOnChange);
    }
}

async function selectModelosNotificacaoAtiva(modeloId) {
    const res = await apiGetModelosNotificacaoAtiva(modeloId);
    if (res) {
        // Armazena modelos completos (incluindo tipo) no sessionStorage
        sessionStorage.setItem("modelos_not_ativa", JSON.stringify(res.data.modelos));
        const modelos = res.data.modelos.map(x => { return { id: x.id, description: x.nome, tipo: x.tipo } });
        const modelosOrdenados = modelos.sort((a, b) => a.description.localeCompare(b.description));
        setSelect(`#selectModelosModalNotAtiva`, modelosOrdenados ?? []);
        $("#selectModelosModalNotAtiva").val("");
    }
}

async function selectAtendentes(equipeId, departamentoId) {
    const res = await apiGetAtendentes(equipeId, departamentoId);

    if (res) {
        setSelect(`#selectAtendentes`, res.data.atendentes);
    }
}

async function selectEquipes(atendenteId, departamentoId) {
    const res = await apiGetEquipes(atendenteId, departamentoId);

    if (res) {
        setSelect(`#selectEquipes`, res.data.equipes);
    }
}

async function selectDepartamentos(atendenteId, equipeId) {
    const res = await apiGetDepartamentos(atendenteId, equipeId);

    if (res) {
        setSelect(`#selectDepartamentos`, res.data.departamentos);
    }
}

async function selectCanais() {
    const selectId = '#selectCanais';
    const res = await apiGetCanais();

    const canais = ordenaCanaisParaFiltroSelect(res.data.canais);

    if (res) {
        setSelect(selectId, canais);
    }
}

function ordenaCanaisParaFiltroSelect(canais) {
    canais.push(canais.splice(canais.findIndex(c => c.id === "blip"), 1)[0]);
    canais.push(canais.splice(canais.findIndex(c => c.id === "outro"), 1)[0]);

    canais = canais.filter(x => x.id !== "businessmessages");

    return canais;
}

function clearFilter() {
    sessionStorage.removeItem("filter_equipe");
    sessionStorage.removeItem("filter_atendente");
    sessionStorage.removeItem("filter_canal");
    sessionStorage.removeItem("filter_contato");
    sessionStorage.removeItem("filter_inicial");
    sessionStorage.removeItem("filter_final");
    sessionStorage.removeItem("filter_status_pending");
    sessionStorage.removeItem("filter_status_waiting");
    sessionStorage.removeItem("filter_status_open");
    sessionStorage.removeItem("filter_status_closed");
}

async function clearFilterSelects() {
    clearFilter();

    $(`#selectAtendentes`).val("");
    $(`#selectEquipes`).val("");
    $("#selectCanais").val("");
    $(`#inputContato`).val("");
    $(`#inputDataAtedimentoInicial`).val("");
    $(`#inputDataAtedimentoFinal`).val("");
    $(`#checkWaiting`).prop('checked', false);
    $(`#checkPending`).prop('checked', false);
    $(`#checkOpen`).prop('checked', false);
    $(`#checkClosed`).prop('checked', false);

    await getFiltros();
}

async function setFilter() {
    // const filterEquipe = sessionStorage.getItem("filter_equipe");
    // if (filterEquipe) {
    //     $(`#selectEquipes`).val(filterEquipe);
    // }

    // const filterDepartamento = sessionStorage.getItem("filter_departamento");
    // if (filterDepartamento) {
    //     $(`#selectDepartamentos`).val(filterDepartamento);
    // }

    // const filterAtendente = sessionStorage.getItem("filter_atendente");
    // if (filterAtendente != null) {
    //     $(`#selectAtendentes`).val(filterAtendente);
    // } else {
    const emailUsuarioLogado = getUsuario().Email;

    if (emailUsuarioLogado) {
        let usuario = getAtendentePeloEmail(emailUsuarioLogado);
        if (usuario) {
            $(`#selectAtendentes`).val(usuario.value);

            if ($(`#selectEquipes`).val() === "" &&
                !usuario.equipes.find(t => $(`#selectEquipes`).val())) {
                $(`#selectEquipes`).val(usuario.equipes[0]);
            }
        }
    }
    // }
    $("#selectAtendentes").trigger("change");

    // const filterCanal = sessionStorage.getItem("filter_canal");
    // if (filterCanal) {
    //     $("#selectCanais").val(filterCanal);
    // }

    // const filterContato = sessionStorage.getItem("filter_contato");
    // if (filterContato) {
    //     $(`#inputContato`).val(filterContato);
    // }

    // const filterInicial = sessionStorage.getItem("filter_inicial");
    // if (filterInicial) {
    //     $(`#inputDataAtedimentoInicial`).val(filterInicial);
    // }

    // const filterFinal = sessionStorage.getItem("filter_final");
    // if (filterFinal) {
    //     $(`#inputDataAtedimentoFinal`).val(filterFinal);
    // }

    $(`#checkPending`).prop('checked', true);

    // const filterStatusWaiting = sessionStorage.getItem("filter_status_waiting");
    // if (filterStatusWaiting != undefined) {
    //     $(`#checkWaiting`).prop('checked', filterStatusWaiting == "true" ? true : false);
    // } else {
    $(`#checkWaiting`).prop('checked', true);
    // }

    // const filterStatusOpen = sessionStorage.getItem("filter_status_open");
    // if (filterStatusOpen != undefined) {
    //     $(`#checkOpen`).prop('checked', filterStatusOpen == "true" ? true : false);
    // } else {
    $(`#checkOpen`).prop('checked', true);
    // }

    // const filterStatusClosed = sessionStorage.getItem("filter_status_closed");
    // if (filterStatusClosed != undefined) {
    //     $(`#checkClosed`).prop('checked', filterStatusClosed == "true" ? true : false);
    // }
}

async function inputIdAtendimentoOnChange() {
    let atendimentoId = $(`#inputAtendimentoId`).val();
    let disabled = (atendimentoId > 0);

    $("#selectAtendentes").attr("disabled", disabled);
    $("#selectEquipes").attr("disabled", disabled);
    $("#selectDepartamentos").attr("disabled", disabled);
    $("#inputDataAtedimentoInicial").attr("disabled", disabled);
    $("#inputDataAtedimentoFinal").attr("disabled", disabled);
    $("#inputContato").attr("disabled", disabled);
    $("#selectCanais").attr("disabled", disabled);
    $("#checkWaiting").attr("disabled", disabled);
    $("#checkOpen").attr("disabled", disabled);
    $("#checkClosed").attr("disabled", disabled);
}

async function selectAtendentesOnChange() {
    let atendente = $(`#selectAtendentes`).val();
    let atendenteId = getIdSelect("#selectAtendentes");
    let equipeId = getIdSelect("#selectEquipes");
    let departamentoId = getIdSelect("#selectDepartamentos");

    await selectDepartamentos(atendenteId, equipeId);
    await selectEquipes(atendenteId, departamentoId);

    if (departamentoId > 0) {
        setIdSelect("#selectDepartamentos", departamentoId);
    }

    if (equipeId > 0) {
        setIdSelect("#selectEquipes", equipeId);
    }

    if (equipeId > 0 || departamentoId > 0) {
        await selectAtendentes(equipeId, departamentoId);
        setIdSelect("#selectAtendentes", atendenteId);
    }

    sessionStorage.setItem("filter_atendente", atendente);
}

async function selectEquipesOnChange() {
    let equipeId = getIdSelect("#selectEquipes");
    let departamentoId = getIdSelect("#selectDepartamentos");
    let atendenteId = getIdSelect("#selectAtendentes");

    await selectAtendentes(equipeId, departamentoId);
    await selectDepartamentos(atendenteId, equipeId);

    if (departamentoId > 0) {
        setIdSelect("#selectDepartamentos", departamentoId);
    }

    if (atendenteId > 0) {
        setIdSelect("#selectAtendentes", atendenteId);
    }

    if (departamentoId > 0 || atendenteId > 0) {
        await selectEquipes(atendenteId, departamentoId);
        setIdSelect("#selectEquipes", equipeId);
    }

    sessionStorage.setItem("filter_equipe", $(`#selectEquipes`).val());
}

async function selectDepartamentosOnChange() {
    let departamentoId = getIdSelect("#selectDepartamentos");
    let equipeId = getIdSelect("#selectEquipes");
    let atendenteId = getIdSelect("#selectAtendentes");

    await selectAtendentes(equipeId, departamentoId);
    await selectEquipes(atendenteId, departamentoId);

    if (equipeId > 0) {
        setIdSelect("#selectEquipes", equipeId);
    }

    if (atendenteId > 0) {
        setIdSelect("#selectAtendentes", atendenteId);
    }

    if (equipeId > 0 || atendenteId > 0) {
        await selectDepartamentos(atendenteId, equipeId);
        setIdSelect("#selectDepartamentos", departamentoId);
    }

    sessionStorage.setItem("filter_departamento", $(`#selectDepartamentos`).val());
}

async function selectContatoOnChange() {
    const contatoSeleciodado = document.querySelector(`#selectContatosModalNotAtiva`).data;
    if (contatoSeleciodado && contatoSeleciodado.id > 0) {
        const contatoId = contatoSeleciodado.id;
        const contatos = JSON.parse(sessionStorage.getItem("contatos_not_ativa"));
        const contato = contatos.find(c => c.id === contatoId);

        const inputWhatsappContato = $("#inputWhatsAppContatoNotAtiva");
        const inputCidadeContato = $("#inputCidadeContatoNotAtiva");
        const inputEmpresaContato = $("#inputEmpresaContatoNotAtiva");

        inputWhatsappContato.val(contato.whatsapp ? contato.whatsapp : "");
        inputCidadeContato.val(contato.cidade ? contato.cidade : "");
        inputEmpresaContato.val(contato.empresa ? contato.empresa : "");

        $("#selectModelosModalNotAtiva").attr("disabled", false);
    }
}

async function selectModeloOnChange() {
    const modeloId = parseInt(getIdSelect("#selectModelosModalNotAtiva"));

    if (modeloId > 0) {
        const res = await apiGetModeloNotificacaoAtiva(modeloId, true);
        if (res.data.modelos.length > 0) {
            const modelo = res.data.modelos[0];
            
            // Armazena o modelo completo no sessionStorage para acesso ao tipo
            const modelos = JSON.parse(sessionStorage.getItem("modelos_not_ativa") || "[]");
            const modeloIndex = modelos.findIndex(m => m.id === modeloId);
            if (modeloIndex >= 0) {
                modelos[modeloIndex] = modelo; // Atualiza com o modelo completo
            } else {
                modelos.push(modelo); // Adiciona se não existir
            }
            sessionStorage.setItem("modelos_not_ativa", JSON.stringify(modelos));
            
            const parametrosDiv = $("#parametrosNotAtiva");
            let parametroInput = ``;
            parametrosDiv.empty();

            // Mostra campo de PDF se necessário
            mostrarCampoPdfSeNecessario(modelo);
            updateEnviarButtonState();

            const countParametros = modelo.parametros ? modelo.parametros.length : 0;

            if (countParametros === 0) return showModeloConteudoDiv(modelo);

            const colunas = countParametros > 2 ? 2 : countParametros;
            const tamanhoColuna = 12 / colunas;
            let colunaAtual = 1;
            const parametrosParaConteudo = []
            const parametrosStorage = [];

            for (let i = 0; i < countParametros; i++) {
                if (colunaAtual === 1) {
                    parametroInput += `<div class="form-row w-100">`;
                }

                const parametro = modelo.parametros[i];
                let propriedadePreenchida = false;
                if (parametro.propriedade > 0) {
                    propriedadePreenchida = true;
                    const ehNovoContato = sessionStorage.getItem("eh_not_ativa_novo_contato") === "true";
                    if (ehNovoContato) {
                        const novoContato = JSON.parse(sessionStorage.getItem("not_ativa_novo_contato"));
                        preencheParametroValorSePropriedade(parametro, novoContato);
                    } else {
                        const contatoSelecionadoId = document.querySelector(`#selectContatosModalNotAtiva`).data.id;
                        const contatos = JSON.parse(sessionStorage.getItem("contatos_not_ativa"));
                        const contato = contatos.find(c => c.id === contatoSelecionadoId);
                        if (contato) {
                            preencheParametroValorSePropriedade(parametro, contato);
                        }
                    }
                } else {
                    parametro.valor = "";
                }

                const parametroSpanStyle = `color: red;${parametro.propriedade > 0 && parametro.valor ? 'font-weight: 400' : 'font-weight: bold;'}`;
                parametrosParaConteudo.push({
                    target: `{{${parametro.ordem}}}`,
                    html: `
                        <span id="${`conteudoParametro${parametro.ordem}`}" style="${parametroSpanStyle}">
                            ${parametro.propriedade > 0 && parametro.valor ? parametro.valor : `{${parametro.ordem}}`}
                        </span>
                    `
                });

                parametroInput += `
                    <div class="${`col-${tamanhoColuna}`}">
                        <div class="form-group">
                            <label for="inputParametro${parametro.ordem}">${parametro.nome}</label>
                            <input type="text" class="form-control" id="inputParametro${parametro.ordem}" placeholder="${parametro.nome}" 
                                    ${parametro.propriedade > 0 ? 'disabled' : ''} 
                                    onchange="inputParametroOnChange(${parametro.id})"
                                    value="${parametro.propriedade > 0 ? parametro.valor : ''}">
                        </div>
                    </div>
                `
                if (colunaAtual === colunas) {
                    parametroInput += `</div>`;
                    colunaAtual = 0;
                }

                parametrosStorage.push(parametro);
                colunaAtual++;
            }

            sessionStorage.setItem("parametros_not_ativa", JSON.stringify(parametrosStorage));

            parametrosDiv.append(parametroInput);
            parametrosDiv.show();

            showModeloConteudoDiv(modelo, parametrosParaConteudo);
        }
    }
}

function showModeloConteudoDiv(modelo, parametros) {
    let conteudoFormatado = modelo.conteudo;
    if (parametros) {
        parametros.forEach(parametro => {
            conteudoFormatado = conteudoFormatado.replaceAll(parametro.target, parametro.html);
        });
    }

    const modeloConteudoDiv = $("#modeloConteudoNotAtiva");
    modeloConteudoDiv.empty();
    let modeloConteudo = `
                <label for="modeloConteudoDiv">Conteúdo</label>
                <div id="modeloConteudoDiv" class="col-12 py-2 border rounded" style="border: 1px solid #ced4da">
                        ${conteudoFormatado}
                </div>
            `;

    modeloConteudoDiv.append(modeloConteudo);
    modeloConteudoDiv.show();
}

function preencheParametroValorSePropriedade(parametro, novoContato) {
    switch (parametro.propriedade) {
        case 1:
            parametro.valor = novoContato.nome;
            break;
        case 2:
            parametro.valor = novoContato.cidade;
            break;
        case 3:
            parametro.valor = novoContato.empresa;
            break;
    }
}

function inputParametroOnChange(parametroId) {
    if (parametroId > 0) {
        const parametrosStorage = JSON.parse(sessionStorage.getItem("parametros_not_ativa"));
        const parametro = parametrosStorage.find(p => p.id === parametroId);
        const input = $(`#inputParametro${parametro.ordem}`);

        if (parametro.propriedade > 0) return;

        parametro.valor = input.val();
        sessionStorage.setItem("parametros_not_ativa", JSON.stringify(parametrosStorage));
        updateConteudoModeloNotificacaoAtiva(parametro);
    }
}

function updateConteudoModeloNotificacaoAtiva(parametro) {
    const conteudoDiv = $("#modeloConteudoDiv");
    const conteudo = conteudoDiv.html();
    const parametroSpan = $(`#conteudoParametro${parametro.ordem}`);
    const novoStyle = `color: red;${parametro.valor ? 'font-weight: 400' : 'font-weight: bold;'}`;
    const novoParametroSpan = `
            <span id="${`conteudoParametro${parametro.ordem}`}" style="${novoStyle}">
                ${parametro.valor ? parametro.valor : `{${parametro.ordem}}`}
            </span>
        `;

    conteudoDiv.html(conteudo.replaceAll(parametroSpan.html(), novoParametroSpan));
}

let pdfFileData = null; // Armazena o arquivo PDF em base64

function getMimeTypesPorTipo(tipo) {
    switch (tipo) {
        case 2: return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        case 3: return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        case 4: return ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        default: return [];
    }
}

function validarPdfAnexado() {
    const input = document.getElementById('inputPdfNotAtiva');
    const file = input.files[0];
    const pdfInputWrapper = $('#pdfInputWrapperNotAtiva');
    const pdfPreviewDiv = $('#pdfPreviewNotAtiva');
    const pdfFileNameSpan = $('#pdfFileNameNotAtiva');

    if (file) {
        // Obtém o tipo do modelo selecionado
        const modeloId = parseInt(getIdSelect("#selectModelosModalNotAtiva"));
        const modelos = JSON.parse(sessionStorage.getItem("modelos_not_ativa") || "[]");
        const modelo = modelos.find(m => m.id === modeloId);
        const tipoModelo = modelo ? modelo.tipo : 0;

        // Valida o tipo do arquivo conforme o tipo do modelo
        const mimesAceitos = getMimeTypesPorTipo(tipoModelo);
        if (mimesAceitos.length > 0 && !mimesAceitos.includes(file.type)) {
            const tipoNome = getNomeTipoAnexo(tipoModelo);
            alertError(`Tipo de arquivo inválido! Apenas arquivos do tipo ${tipoNome} são aceitos.`);
            input.value = '';
            pdfInputWrapper.show();
            pdfPreviewDiv.hide();
            pdfFileData = null;
            updateEnviarButtonState();
            return;
        }

        // Valida tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alertError('O arquivo deve ter no máximo 10MB!');
            input.value = '';
            pdfInputWrapper.show();
            pdfPreviewDiv.hide();
            pdfFileData = null;
            updateEnviarButtonState();
            return;
        }

        // Lê o arquivo e converte para base64
        const reader = new FileReader();
        reader.onload = function(e) {
            pdfFileData = e.target.result;
            sessionStorage.setItem('pdf_not_ativa', pdfFileData);
        };
        reader.readAsDataURL(file);

        // Exibe preview e esconde o input
        pdfFileNameSpan.text(file.name);
        pdfInputWrapper.hide();
        pdfPreviewDiv.show();

        updateEnviarButtonState();
    }
}

function removerPdfAnexado(mostrarUpload = true) {
    const input = document.getElementById('inputPdfNotAtiva');
    const pdfUploadDiv = $('#pdfUploadNotAtiva');
    const pdfInputWrapper = $('#pdfInputWrapperNotAtiva');
    const pdfPreviewDiv = $('#pdfPreviewNotAtiva');

    input.value = '';
    pdfFileData = null;
    sessionStorage.removeItem('pdf_not_ativa');
    pdfPreviewDiv.hide();
    pdfInputWrapper.show();

    if (!mostrarUpload) {
        pdfUploadDiv.hide();
    }

    updateEnviarButtonState();
}

function mostrarCampoPdfSeNecessario(modelo) {
    const pdfUploadDiv = $('#pdfUploadNotAtiva');
    const inputArquivo = $('#inputPdfNotAtiva');
    const helpText = $('#helpTextAnexoNotAtiva');
    
    // Se tipo > 1 (imagem, documento ou video), exige anexo
    if (modelo.tipo > 1) {
        const tipoAnexo = getNomeTipoAnexo(modelo.tipo);
        const acceptTypes = getAcceptTypes(modelo.tipo);
        
        // Atualiza label com o tipo de anexo necessário
        $('#labelAnexoNotAtiva').text(`Anexar ${tipoAnexo}*`);
        helpText.text(`Apenas arquivos ${tipoAnexo} são aceitos. O anexo é obrigatório para este modelo.`);
        inputArquivo.attr('accept', acceptTypes);
        
        pdfUploadDiv.show();
    } else {
        pdfUploadDiv.hide();
        removerPdfAnexado(false);
    }
}

/**
 * Retorna os tipos de arquivo aceitos no input baseado no tipo do modelo
 * @param {number} tipo - 1=texto, 2=imagem, 3=documento, 4=video
 * @returns {string} Tipos aceitos no formato ".ext,.ext"
 */
function getAcceptTypes(tipo) {
    switch (tipo) {
        case 2: return '.jpg,.jpeg,.png,.gif,.webp';  // imagem
        case 3: return '.pdf,.doc,.docx';              // documento
        case 4: return '.mp4,.mov,.avi';               // video
        default: return '*';
    }
}

/**
 * Retorna o nome legível do tipo de anexo baseado no tipo do modelo
 * @param {number} tipo - 1=texto, 2=imagem, 3=documento, 4=video
 * @returns {string} Nome do tipo de anexo
 */
function getNomeTipoAnexo(tipo) {
    switch (tipo) {
        case 2: return 'imagem';
        case 3: return 'PDF';
        case 4: return 'vídeo';
        default: return 'arquivo';
    }
}

function updateEnviarButtonState() {
    const modeloId = parseInt(getIdSelect("#selectModelosModalNotAtiva"));
    const btnEnviar = $('button[onclick="enviarNotificacaoAtiva()"]');
    const inputArquivo = document.getElementById('inputPdfNotAtiva');
    const arquivoSelecionado = inputArquivo && inputArquivo.files && inputArquivo.files.length > 0;

    if (modeloId > 0) {
        // Primeiro tenta obter do sessionStorage
        const modelos = JSON.parse(sessionStorage.getItem("modelos_not_ativa") || "[]");
        const modelo = modelos.find(m => m.id === modeloId);

        if (modelo && modelo.tipo > 1) {
            // Modelo exige anexo (tipo > 1) - verifica se está anexado
            // Verifica tanto o input file quanto as variáveis de memória/sessionStorage
            const pdfAnexado = arquivoSelecionado || pdfFileData || sessionStorage.getItem('pdf_not_ativa');
            if (!pdfAnexado) {
                btnEnviar.prop('disabled', true);
                btnEnviar.attr('title', 'Anexe um arquivo para continuar');
                return;
            }
        }
    }

    btnEnviar.prop('disabled', false);
    btnEnviar.attr('title', '');
}

function inputContatoOnChange() {
    sessionStorage.setItem("filter_contato", $(`#inputContato`).val());
}

function inputDataAtedimentoInicialOnChange() {
    sessionStorage.setItem("filter_inicial", $(`#inputDataAtedimentoInicial`).val());
}

function inputDataAtedimentoFinalOnChange() {
    sessionStorage.setItem("filter_final", $(`#inputDataAtedimentoFinal`).val());
}

function selectCanaisOnChange() {
    sessionStorage.setItem("filter_canal", $(`#selectCanais`).val());
}

function checkPendingOnChange() {
    sessionStorage.setItem("filter_status_pending", $(`#checkPending`).is(":checked"));
}

function checkWaitingOnChange() {
    sessionStorage.setItem("filter_status_waiting", $(`#checkWaiting`).is(":checked"));
}

function checkOpenOnChange() {
    sessionStorage.setItem("filter_status_open", $(`#checkOpen`).is(":checked"));
}

function checkClosedOnChange() {
    sessionStorage.setItem("filter_status_closed", $(`#checkClosed`).is(":checked"));
}

async function filterAtendimentos() {
    setUltimaPagina(false);

    await getAtendimentos({
        iniciarNaPagina1: true,
        fecharAtendimentoAberto: true,
        resetAtendimentoPagina: true
    });

    $("#modalFilter").modal("hide");
}

async function getAtendimentos(params, loading = true) {
    const paginaFim = getPaginaAtendimento();
    const paginaInicio = params.iniciarNaPagina1 ? 0 : paginaFim - 1;

    if (isNull(params.aguardar, 0) > 0)
        await sleep(params.aguardar);

    if (params.fecharAtendimentoAberto)
        showDivChatEmpty();

    if (params.resetAtendimentoPagina)
        resetPaginaAtendimento();

    let id = $("#inputAtendimentoId").val();
    let equipe = getIdSelect("#selectEquipes");
    let departamento = getIdSelect("#selectDepartamentos");
    let atendente = getIdSelect("#selectAtendentes");
    let contato = $("#inputContato").val();
    let atendimentoInicial = $("#inputDataAtedimentoInicial").val();
    let atendimentoFinal = $("#inputDataAtedimentoFinal").val();
    let canal = getIdSelect("#selectCanais");
    let pendente = $("#checkPending").is(":checked");
    let aguardando = $("#checkWaiting").is(":checked");
    let atendendo = $("#checkOpen").is(":checked");
    let finalizado = $("#checkClosed").is(":checked");

    moment.locale("pt-br");

    const _response = await apiGetAtendimentos({
        id,
        paginaInicio,
        paginaFim,
        equipe,
        departamento,
        atendente,
        canal,
        contato,
        atendimentoInicial,
        atendimentoFinal,
        pendente,
        aguardando,
        atendendo,
        finalizado
    }, loading);

    if (_response && _response.status === 200) {
        let atendimentos = _response.data.atendimentos;
        let quantidadeAtendimentos = _response.data.quantidadeAtendimentos;

        let temAtendimentos = (atendimentos.length > 0);
        let temMaisPaginas = (atendimentos.length !== quantidadeAtendimentos);
        let estaNoInicioDaPagina = (paginaInicio === 0);

        let tBody = $("#table-atendimentos tbody");
        $("#none").remove();
        $("#nomore").remove();

        if (paginaInicio === 0) {
            tBody.empty();
        } else {
            removeLoadingInTbody();
        }

        if (!temAtendimentos && estaNoInicioDaPagina) {
            tBody.append(`
                <tr id="none" class="message-atendimento">
                    <td class="align-middle">
                        <div class="content">
                            Nenhum atendimento encontrado
                        </div>
                    </td>
                </tr>
            `);
        }

        atendimentos.forEach(atendimento => {
            let stringMensagensNaoRespondidas = ``;
            let stringAtendenteEquipe = ``;

            if (atendimento.quantidadeMensagensNaoRespondidas > 0) {
                stringMensagensNaoRespondidas = `<span id="countNewMessages" class="count-new-message show">${atendimento.quantidadeMensagensNaoRespondidas}</span>`
            }

            if (atendimento.atendente.nome) {
                stringAtendenteEquipe += atendimento.atendente.nome;
            }

            if (atendimento.equipe.nome) {
                stringAtendenteEquipe += stringAtendenteEquipe.length > 0 ? " - " : "";
                stringAtendenteEquipe += atendimento.equipe.nome;
            } else if (atendimento.departamento.nome) {
                stringAtendenteEquipe += stringAtendenteEquipe.length > 0 ? " - " : "";
                stringAtendenteEquipe += atendimento.departamento.nome;
            }

            if (stringAtendenteEquipe.length > 0) {
                stringAtendenteEquipe = stringAtendenteEquipe;
            }

            tBody.append(`
                <tr id="${atendimento.id}" class="cursor-pointer ticket" onclick="abreAtendimentoPeloId('${atendimento.id}')" >
                    <td>
                        <div class="row align-middle" style="margin: 0;">
                            <div class="ticket-icon">   
                                ${getContatoImg(atendimento.contato.urlFoto)}
                                ${getCanalIcon(atendimento.contato.canal)}
                            </div>
                            <div class="ticket-content">
                                <div class="ticket-content-div">
                                    <div class="div-contato" title="${atendimento.contato.nome} - ${atendimento.status.description}">
                                        <b>${atendimento.contato.nome}</b> ${getStatusIcon(atendimento.status.id)}
                                    </div>
                                    <div class="div-datahora-ultima-mensagem" title="${atendimento.dataUltimaMensagem}">
                                        ${atendimento.dataUltimaMensagem}
                                    </div>
                                </div>
                                <div class="ticket-content-div">
                                    <div class="div-atendimento-dados" title="${stringAtendenteEquipe}">
                                        ${stringAtendenteEquipe}
                                    </div>
                                    <div class="div-mensagens-nao-lidas">
                                        ${stringMensagensNaoRespondidas}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row divider">
                        </div>
                    </td>
                </tr>
            `);
        });

        if ((temAtendimentos && !temMaisPaginas) || (!temAtendimentos && !estaNoInicioDaPagina)) {
            setUltimaPagina(true);

            tBody.append(`
                <tr id="nomore" class="message-atendimento">
                    <td class="align-middle text-center">
                        <div class="content">
                            Não há mais atendimentos...
                        </div>
                    </td>
                </tr>
            `);
        }
    }

    setSelectedTicket(getAtendimentoId())
    validaTicketUrl();
}

function atendimentosOnScroll() {
    const tBody = document.getElementById("table-atendimentos").getElementsByTagName("tBody")[0];
    const loading = document.getElementById("loadingTBody");
    const scrollTop = tBody.scrollTop + tBody.offsetHeight;
    const scrollHeight = tBody.scrollHeight;

    if (scrollTop === scrollHeight && !loading) {
        nextPage();
    }
}

async function nextPage() {
    const ultimaPagina = getUltimaPagina();

    if (!ultimaPagina) {
        setLoadingNoTbody();

        incrementaPaginaAtendimento();

        await getAtendimentos({
            iniciarNaPagina1: false,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: false
        });
    }
}

function getPaginaAtendimento() {
    let pagina = $("body").data('pagina');

    if (!pagina) {
        incrementaPaginaAtendimento();

        pagina = $("body").data('pagina');
    }

    return pagina;
}

function incrementaPaginaAtendimento() {
    let pagina = $("body").data('pagina');
    $("body").data('pagina', (pagina ? pagina + 1 : 1));
}

function resetPaginaAtendimento() {
    $("body").data('pagina', 1);
}

function setLoadingNoTbody() {
    const tBody = document.getElementById("table-atendimentos").getElementsByTagName("tBody")[0];

    tBody.insertAdjacentHTML('beforeend', `
        <tr>
            <td colspan="1" class="text-center" id="loadingTBody">
                Aguarde... Carregando mais atendimentos.
            </td>
        </tr>
    `);

    tBody.scrollTop = tBody.scrollHeight;
}

function removeLoadingInTbody() {
    let elemento = document.getElementById("loadingTBody");

    if (elemento) {
        elemento.remove();
    }
}

function atender(atendimentoId, contatoId) {
    confirmSommus({
        title: 'Atender',
        description: `Confirma o atendimento?`,
        type: 'warning',
        cancel: {
            text: 'Não'
        },
        confirm: {
            text: 'Sim',
            function: `efetivaAtendimento(${atendimentoId}, ${contatoId})`
        }
    });
}

function abreModal(preview = false) {
    if (preview) {
        $("#modal").find("#btnCancelar").text("Fechar");
        $("#modal").find("#btnCancelar").show()
        $("#modal").find("#btnSalvar").hide();
    } else {
        $("#modal").find("#btnCancelar").text("Cancelar");
        $("#modal").find("#btnCancelar").show()
        $("#modal").find("#btnSalvar").show();
    }

    $("#modal").modal('show');
}

async function efetivaAtendimento(atendimentoId, contatoId) {
    const _response = await apiPostAtender(atendimentoId, contatoId);

    if (_response && _response.status === 200) {
        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: false,
            aguardar: awaitList * 2
        });

        await abreAtendimento({
            id: atendimentoId,
            loading: false,
            aguardar: 0
        });
    }

    $("#modal").modal('hide');
}

async function transferencia(atendimentoId) {
    $("#modal").modal();

    $("#modal").find("#title").text("Transferência");
    $("#modal").find(".modal-body").empty().append(`
        <div class="row">
            <div class="col-12">
                <div class="form-group">
                    <label for="selectTransferenciaAtendentes">Atendente</label>
                    <select id="selectTransferenciaAtendentes" class="form-control" onchange="selectTransferenciaAtendentesOnChange();"></select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="form-group">
                    <label for="selectTransferenciaEquipes">Equipe</label>
                    <select id="selectTransferenciaEquipes" class="form-control" onchange="selectTransferenciaEquipesOnChange();"></select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="form-group">
                    <label for="selectTransferenciaDepartamentos">Departamento</label>
                    <select id="selectTransferenciaDepartamentos" class="form-control" onchange="selectTransferenciaDepartamentosOnChange();"></select>
                </div>
            </div>
        </div>
    `);
    $("#modal").find("#btnCancelar").text("Cancelar")
    $("#modal").find("#btnSalvar").text("Transferir").off('click').on('click', () => efetivaTransferencia(atendimentoId))

    await selectTransferenciaAtendentes(0, 0);
    await selectTransferenciaEquipes(0, 0);
    await selectTransferenciaDepartamentos(0, 0);

    abreModal();
}

async function selectTransferenciaAtendentes(equipeId, departamentoId) {
    const response = await apiGetAtendentes(equipeId, departamentoId);

    if (response) {
        setSelect(`#selectTransferenciaAtendentes`, response.data.atendentes);
    }
}

async function selectTransferenciaEquipes(atendenteId, departamentoId) {
    const res = await apiGetEquipes(atendenteId, departamentoId);

    if (res) {
        setSelect(`#selectTransferenciaEquipes`, res.data.equipes);
    }
}

async function selectTransferenciaDepartamentos(atendenteId, equipeId) {
    const res = await apiGetDepartamentos(atendenteId, equipeId);

    if (res) {
        setSelect(`#selectTransferenciaDepartamentos`, res.data.departamentos);
    }
}

async function selectTransferenciaAtendentesOnChange() {
    let atendenteId = getIdSelect("#selectTransferenciaAtendentes");
    let equipePrincipalId = getDataSelect("#selectTransferenciaAtendentes", "equipe-principal")
    let departamentoPrincipalId = getDataSelect("#selectTransferenciaAtendentes", "departamento-principal")

    await selectTransferenciaDepartamentos(atendenteId, 0);
    await selectTransferenciaEquipes(atendenteId, 0);

    if (departamentoPrincipalId > 0) {
        setIdSelect("#selectTransferenciaDepartamentos", departamentoPrincipalId);
    }

    if (equipePrincipalId > 0) {
        setIdSelect("#selectTransferenciaEquipes", equipePrincipalId);
    }
}

async function selectTransferenciaEquipesOnChange() {
    let equipeTransferenciaId = getIdSelect("#selectTransferenciaEquipes");
    let atendenteTransferenciaId = getIdSelect("#selectTransferenciaAtendentes");
    let departamentoTransferenciaId = getIdSelect("#selectTransferenciaDepartamentos");
    let departamentoEquipeId = getDataSelect("#selectTransferenciaEquipes", "departamento-id");

    await selectTransferenciaAtendentes(equipeTransferenciaId, departamentoEquipeId);
    await selectTransferenciaDepartamentos(atendenteTransferenciaId, equipeTransferenciaId);

    if (departamentoEquipeId > 0) {
        setIdSelect("#selectTransferenciaDepartamentos", departamentoEquipeId);
    } else if (departamentoTransferenciaId > 0) {
        setIdSelect("#selectTransferenciaDepartamentos", departamentoTransferenciaId);
    }

    if (atendenteTransferenciaId > 0) {
        setIdSelect("#selectTransferenciaAtendentes", atendenteTransferenciaId);
    }
}

async function selectTransferenciaDepartamentosOnChange() {
    let departamentoTransferenciaId = getIdSelect("#selectTransferenciaDepartamentos");
    let equipeTransferenciaId = getIdSelect("#selectTransferenciaEquipes");
    let atendenteTransferenciaId = getIdSelect("#selectTransferenciaAtendentes");

    await selectTransferenciaAtendentes(equipeTransferenciaId, departamentoTransferenciaId);
    await selectTransferenciaEquipes(atendenteTransferenciaId, departamentoTransferenciaId);

    if (equipeTransferenciaId > 0) {
        setIdSelect("#selectTransferenciaEquipes", equipeTransferenciaId);
    }

    if (atendenteTransferenciaId > 0) {
        setIdSelect("#selectTransferenciaAtendentes", atendenteTransferenciaId);
    }
}

async function efetivaTransferencia(atendimentoId) {
    let atendenteId = getIdSelect("#selectTransferenciaAtendentes");
    let departamentoId = getIdSelect("#selectTransferenciaDepartamentos");
    let equipeId = getIdSelect("#selectTransferenciaEquipes");

    const resTransferencia = await apiPostTransferir(atendimentoId,
        equipeId, departamentoId, atendenteId);

    if (resTransferencia && resTransferencia.status && resTransferencia.status === 200) {
        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: true,
            aguardar: awaitList
        });

        $("#modal").modal('hide');
    }
}

async function finalizar(atendimentoId) {
    confirmSommus({
        title: 'Finalizar',
        description: `Deseja finalizar o atendimento agora?`,
        type: 'warning',
        cancel: {
            text: 'Não'
        },
        confirm: {
            text: 'Sim',
            function: `efetivaFinalizacao(${atendimentoId})`
        }
    });
}

async function efetivaFinalizacao(atendimentoId) {
    const response = await apiGetAtendimentoFinalizar(atendimentoId);

    if (response.status && response.status === 200) {
        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: true,
            resetAtendimentoPagina: true,
            aguardar: awaitList
        });

        $("#modal").modal('hide');
    }
}

function setNotify() {
    if (!Notification) {
        alert('Seu navegador não suporta as notificações. Teste com o Google Chrome.');
        return;
    }

    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function showNotify(title, message, link = "") {
    if (Notification.permission !== 'granted')
        Notification.requestPermission();
    else {
        var notification = new Notification(title, {
            icon: '/app/imagens/icone-notify.png',
            body: message,
        });
        incrementUnreadNotifications();

        notification.onclick = function () {
            decrementUnreadNotifications();
            if (link.length > 0) {
                window.open(link, "_self");
            }
            window.focus();
        };
    }
}

function setPasteImageListener() {
    const textarea = document.getElementById('chatText');

    if (!textarea)
        return;

    textarea.addEventListener('paste', (e) => {
        if (!(e.clipboardData && e.clipboardData.items))
            return;

        const items = e.clipboardData.items;
        let file = null;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                file = item.getAsFile();
                break;
            }
        }

        if (file) {
            e.preventDefault();
            clipboardImageFile = file;
            textarea.value = '';
            showClipboardPreview(file);
            if (typeof textChatSetSendButton === 'function')
                textChatSetSendButton();
        }
    });
}

function showClipboardPreview(file) {
    const previewDiv = document.getElementById('clipboardPreview');

    if (!previewDiv || !file)
        return;

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);

    const cancel = document.createElement('span');
    cancel.innerHTML = '&times;';
    cancel.className = 'cancel-preview';
    cancel.addEventListener('click', () => {
        clipboardImageFile = null;
        hideClipboardPreview();
        if (typeof textChatSetSendButton === 'function')
            textChatSetSendButton();
    });

    previewDiv.innerHTML = '';
    previewDiv.appendChild(img);
    previewDiv.appendChild(cancel);
    previewDiv.classList.add('show');
}

function hideClipboardPreview() {
    const previewDiv = document.getElementById('clipboardPreview');
    if (previewDiv) {
        previewDiv.innerHTML = '';
        previewDiv.classList.remove('show');
    }
}

function getTime(time = "") {
    return time ? time : moment().calendar();;
}

async function uploadFile() {
    const atendimentoId = getAtendimentoId();
    const arquivo = document.getElementById("file").files[0];
    const res = await apiPostEnviarArquivo(arquivo);

    document.getElementById("file").value = "";

    if (res.status === 200) {
        await abreAtendimento({
            id: atendimentoId,
            loading: true,
            aguardar: awaitMessage
        });

        if (hasMessagesUnanswered())
            removeMessagesUnanswered();
    }
}

async function uploadClipboardImage(file) {
    const atendimentoId = getAtendimentoId();
    const res = await apiPostEnviarArquivo(file);

    if (res.status === 200) {
        await abreAtendimento({
            id: atendimentoId,
            loading: true,
            aguardar: awaitMessage
        });

        if (hasMessagesUnanswered())
            removeMessagesUnanswered();
    }
}

function createElementFile(obj) {
    const displayName = getFileDisplayName(obj);
    const extension = getFileExtensionLabel(obj);
    const sizeLabel = getFileSizeLabel(obj.size);

    let el = `
        <div class="message file-card" onclick="download('${obj.uri}')" role="button">
            <div class="file-card__icon">
                <span class="icone">
                    <svg height="28px" width="28px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M447.229,67.855h-43.181v-43.18C404.049,11.103,392.944,0,379.379,0H64.771C51.2,0,40.097,11.103,40.097,24.675V419.47 c0,13.571,11.103,24.675,24.675,24.675h43.181v43.181c0,13.571,11.098,24.675,24.675,24.675h209.729 c13.565,0,32.762-7.612,42.638-16.908l68.929-64.882c9.888-9.296,17.969-28.012,17.969-41.583l0.012-296.096 C471.904,78.959,460.8,67.855,447.229,67.855z M107.951,92.531v333.108h-43.18c-3.343,0-6.168-2.825-6.168-6.168V24.675 c0-3.343,2.825-6.168,6.168-6.168H379.38c3.337,0,6.168,2.825,6.168,6.168v43.181H132.626 C119.049,67.856,107.951,78.959,107.951,92.531z M441.24,416.737l-68.929,64.877c-1.412,1.327-3.251,2.628-5.281,3.867v-56.758 c0-4.238,1.709-8.051,4.528-10.888c2.844-2.819,6.656-4.533,10.894-4.533h61.718C443.213,414.602,442.233,415.799,441.24,416.737z M453.385,388.626c0,1.832-0.334,3.954-0.839,6.168h-70.095c-18.721,0.037-33.89,15.206-33.928,33.928v64.024 c-2.202,0.445-4.324,0.746-6.168,0.746H132.626v0.001c-3.35,0-6.168-2.825-6.168-6.168V92.53c0-3.343,2.819-6.168,6.168-6.168 h314.602c3.343,0,6.168,2.825,6.168,6.168L453.385,388.626z"></path>
                    </svg>
                </span>
            </div>

            <div class="file-card__body">
                <div class="file-card__header">
                    <span class="file-card__name" title="${displayName}">
                        ${displayName}
                    </span>
                    ${extension ? `<span class="file-card__extension">${extension}</span>` : ""}
                </div>
                ${sizeLabel ? `<span class="file-card__size">${sizeLabel}</span>` : ""}
            </div>
        </div>
    `;

    return el;
}

function getFileSizeLabel(bytes) {
    if (!bytes || isNaN(bytes)) return "";
    const kbytes = bytes / 1024;
    if (kbytes >= 1024) {
        return `${round(kbytes / 1024, 2)} MB`;
    }
    return `${round(kbytes, 2)} kB`;
}

function sanitizeFileName(name) {
    if (!name) return "";
    try {
        const decoded = decodeURIComponent(name);
        return decoded.split("?")[0];
    } catch (error) {
        return name.split("?")[0];
    }
}

function extractFileNameFromUri(uri = "") {
    if (!uri) return "";
    try {
        const parsed = new URL(uri);
        return parsed.pathname.split("/").pop();
    } catch (error) {
        const segments = uri.split("/");
        return segments[segments.length - 1];
    }
}

function getFileDisplayName(obj = {}) {
    const candidates = [
        obj.originalName,
        obj.filename,
        obj.fileName,
        obj.name,
        obj.title,
        extractFileNameFromUri(obj.uri)
    ].filter(Boolean);

    for (let i = 0; i < candidates.length; i++) {
        const sanitized = sanitizeFileName(candidates[i]);

        if (sanitized && !looksAutoGeneratedName(sanitized)) {
            return sanitized;
        }
    }

    const fallback = candidates
        .map(c => sanitizeFileName(c))
        .find(Boolean);

    if (fallback) {
        if (looksAutoGeneratedName(fallback)) {
            const extension = getFileExtensionLabel(obj);
            return extension ? `Arquivo ${extension}` : "Arquivo";
        }

        return fallback;
    }

    const extension = getFileExtensionLabel(obj);
    return extension ? `Arquivo ${extension}` : "Arquivo";
}

function looksAutoGeneratedName(name) {
    if (!name) return false;

    const normalized = name.trim();
    const withoutQuery = normalized.split("?")[0];
    const base = withoutQuery.split("/").pop();
    const nameWithoutExtension = base.split(".").slice(0, -1).join(".") || base;
    const compact = nameWithoutExtension.replace(/\s+/g, '');
    const azureMediaPattern = /^media[_-]\d+/i;
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const longHexPattern = /^[0-9a-f-]{24,}$/i;

    if (azureMediaPattern.test(compact)) return true;
    if (guidPattern.test(compact)) return true;
    if (longHexPattern.test(compact)) return true;

    return false;
}

function getFileExtensionLabel(obj = {}) {
    const mimeMap = {
        "application/pdf": "PDF",
        "application/msword": "DOC",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
        "application/vnd.ms-powerpoint": "PPT",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
        "application/vnd.ms-excel": "XLS",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
        "text/plain": "TXT",
        "application/x-pkcs12": "PFX",
        "application/pkcs12": "PFX",
        "application/zip": "ZIP",
        "application/x-rar-compressed": "RAR",
        "audio/mpeg": "MP3",
        "audio/ogg": "OGG",
        "voice/ogg": "OGG",
        "video/mp4": "MP4",
        "image/jpeg": "JPG",
        "image/png": "PNG"
    };

    if (obj.extension) return obj.extension.toString().toUpperCase();

    if (obj.type) {
        const normalizedMime = obj.type.toLowerCase();
        if (mimeMap[normalizedMime]) {
            return mimeMap[normalizedMime];
        }
    }

    const name = sanitizeFileName(obj.title || extractFileNameFromUri(obj.uri));
    const match = name.match(/\.([^.]+)$/);
    return match ? match[1].toUpperCase() : "";
}

function createElementAudio(obj) {
    var audio = document.createElement('audio');
    audio.controls = true;
    audio.src = obj.uri;

    activeAudioStart();

    return audio;
}

function createElementImage(obj) {
    let img = document.createElement('img');
    img.src = obj.uri;
    img.width = 200;

    return img;
}

function setIconFile(fontSize = 12) {
    return `
        <svg height="${fontSize}pt" width="${fontSize}pt" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M447.229,67.855h-43.181v-43.18C404.049,11.103,392.944,0,379.379,0H64.771C51.2,0,40.097,11.103,40.097,24.675V419.47 c0,13.571,11.103,24.675,24.675,24.675h43.181v43.181c0,13.571,11.098,24.675,24.675,24.675h209.729 c13.565,0,32.762-7.612,42.638-16.908l68.929-64.882c9.888-9.296,17.969-28.012,17.969-41.583l0.012-296.096 C471.904,78.959,460.8,67.855,447.229,67.855z M107.951,92.531v333.108h-43.18c-3.343,0-6.168-2.825-6.168-6.168V24.675 c0-3.343,2.825-6.168,6.168-6.168H379.38c3.337,0,6.168,2.825,6.168,6.168v43.181H132.626 C119.049,67.856,107.951,78.959,107.951,92.531z M441.24,416.737l-68.929,64.877c-1.412,1.327-3.251,2.628-5.281,3.867v-56.758 c0-4.238,1.709-8.051,4.528-10.888c2.844-2.819,6.656-4.533,10.894-4.533h61.718C443.213,414.602,442.233,415.799,441.24,416.737z M453.385,388.626c0,1.832-0.334,3.954-0.839,6.168h-70.095c-18.721,0.037-33.89,15.206-33.928,33.928v64.024 c-2.202,0.445-4.324,0.746-6.168,0.746H132.626v0.001c-3.35,0-6.168-2.825-6.168-6.168V92.53c0-3.343,2.819-6.168,6.168-6.168 h314.602c3.343,0,6.168,2.825,6.168,6.168L453.385,388.626z"/>
        </svg>
    `;
}

function imgZoom(img) {
    let src = $(img).attr('src');

    $("#modal").find("#title").text("Imagem");
    $("#modal").find(".modal-body").empty().append(`
        <img src="${src}" width="100%" />
    `);

    abreModal(true);
}

function download(url) {
    window.open(url, "_blank");
}

function socketIoInit() {
    socket = io({
        query: {
            usuario: getAtendenteStorage().email
        }
    });

    socket.on('new-ticket', async (data) => {
        const mensagem = data.mensagem;
        const link = ""; //`/home?atendimentoId=${atendimentoId}`;

        showNotify("SommusBLiP", mensagem, link);

        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: false,
            aguardar: awaitList
        }, false);
    });

    socket.on('new-message', async (data) => {
        const mensagem = data.mensagem;
        // const atendimento = data.atendimento;
        const atendimentoId = data.atendimentoId;
        const title = data.titulo;

        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: false,
            aguardar: awaitList
        }, false);

        const semFoco = document.hidden || !document.hasFocus();

        if (Number(atendimentoId) === Number(getAtendimentoId())) {
            await abreAtendimento({
                id: atendimentoId,
                loading: false,
                aguardar: awaitMessage,
                manterListaMensagens: true
            });

            if (semFoco) {
                showNotify(title, mensagem);
            }
        } else {
            showNotify(title, mensagem);
        }
    });

    socket.on('update-tickets-message', async (data) => {
        const atendimentoId = data.atendimentoId;

        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: false,
            aguardar: awaitList
        }, false);

        if (atendimentoId && Number(atendimentoId) === Number(getAtendimentoId())) {
            await abreAtendimento({
                id: atendimentoId,
                loading: false,
                aguardar: awaitMessage,
                manterListaMensagens: true
            });
        }
    });
}

function validaTicketUrl() {
    const atendimentoId = getUrlParameter("atendimentoId")
    if (atendimentoId) {
        abreAtendimentoPeloId(atendimentoId);
        clearUrlParameters("home");
    }
}

function getStatusIcon(status, size = 15) {

    let _color = "rgb(108, 117, 125)";

    if (status === "pending") {
        _color = "#ff9900";
    } else if (status === "waiting") {
        _color = "#ff0000";
    } else if (status === "open") {
        _color = "#25d366";
    } else if (status === "closed") {
        _color = "#4285F4";
    }

    return `
            <svg height="${size}" width="${size}" style="padding-top: 2px;">
                <circle cx="${size / 2}" cy="${size / 2}" r="${(size / 2) - (size / 8)}" fill="${_color}" />
            </svg>
    `;
}

function getContatoImg(url, classCss = "canal-photo", size = 50) {
    if (!url)
        url = "app/imagens/user.png";

    return `<img class="${classCss}" src="${url}" width="${size}" height="${size}" />`;
}

function getCanalIcon(canal, size = 25) {
    switch (canal.idString) {
        case "blip":
            return getCanalIconBlipChat(size);
        case "email":
            return getCanalIconEmail(size);
        case "messenger":
            return getCanalIconFacebook(size);
        case "whatsapp":
            return getCanalIconWhatsApp(size);
        case "instagram":
            return getCanalIconInstagram(size);
        case "businessmessages":
            return getCanalIconGoogle(size);
        case "telegram":
            return getCanalIconTelegram(size);
        case "sms":
            return getCanalIconSMS(size);
        case "workplace":
            return getCanalIconWorkplace(size);
        default:
            return "";
    }
}

function getCanalIconBlipChat(size) {
    return `<img class="canal-icon" src="app/imagens/canais/blip-chat.png" width="${size}" height="${size}" />`;
}

function getCanalIconEmail(size) {
    return `<img class="canal-icon" src="app/imagens/canais/email.png" width="${size}" height="${size}" />`;
}

function getCanalIconFacebook(size) {
    return `<img class="canal-icon" src="app/imagens/canais/facebook.png" width="${size}" height="${size}" />`;
}

function getCanalIconWhatsApp(size) {
    return `<img class="canal-icon" src="app/imagens/canais/whatsapp.png" width="${size}" height="${size}" />`;
}

function getCanalIconInstagram(size) {
    return `<img class="canal-icon" src="app/imagens/canais/instagram.png" width="${size}" height="${size}" />`;
}
function getCanalIconGoogle(size) {
    return `<img class="canal-icon" src="app/imagens/canais/google.png" width="${size}" height="${size}" />`;
}
function getCanalIconTelegram(size) {
    return `<img class="canal-icon" src="app/imagens/canais/telegram.png" width="${size}" height="${size}" />`;
}

function getCanalIconSMS(size) {
    return `<img class="canal-icon" src="app/imagens/canais/sms.png" width="${size}" height="${size}" />`;
}

function getCanalIconWorkplace(size) {
    return `<img class="canal-icon" src="app/imagens/canais/workplace.png" width="${size}" height="${size}" />`;
}

function getAtendentePeloEmail(email) {
    const attendants = getAtendentesDoSelect();
    return attendants.find(e => e.email === email)
}

function getAtendentesDoSelect() {
    let attendants = new Array();

    $(`#selectAtendentes option`).each(
        c => {
            attendants.push({
                value: $($(`#selectAtendentes option`)[c]).val(),
                email: $($(`#selectAtendentes option`)[c]).data("email"),
                equipes: $($(`#selectAtendentes option`)[c]).data("equipes")
            });
        }
    )

    return attendants;
}

function getUltimaPagina() {
    return $("body").data("ultima-pagina")
}

function setUltimaPagina(ultima) {
    $("body").data("ultima-pagina", ultima);
}

function getAtendenteId() {
    return getIdSelect("#selectAtendentes");
}

function getEquipeId() {
    return getIdSelect("#selectEquipes");
}

function getDepartamentoId() {
    return getIdSelect("#selectDepartamentos");
}

function isMobileView() {
    return $(window).width() <= 768;
}

function handleMobileLayout() {
    if (isMobileView()) {
        if ($("#selected").hasClass("hidden")) {
            $("#div-tickets").show();
            $("#backButton").hide();
        } else {
            $("#div-tickets").hide();
            $("#backButton").show();
        }
    } else {
        $("#div-tickets").show();
        $("#backButton").hide();
    }
}

function mobileOpenChat() {
    if (isMobileView()) {
        $("#div-tickets").hide();
        $("#backButton").show();
    }
}

function mobileCloseChat() {
    if (isMobileView()) {
        $("#div-tickets").show();
        $("#backButton").hide();
        hideDivInfo();
    }
}
