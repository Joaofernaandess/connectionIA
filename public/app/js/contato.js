function setDivInfo(atendimento) {
    let contato = atendimento && atendimento.contato ? atendimento.contato : null;
    let permiteEdicao = !atendimento || (atendimento.status.id == "open") && !atendimento.desabilitaChatRegraAtendente;

    if (!contato) {
        contato = getContatoStorage();
    }

    $("#div-chat").addClass("info");

    const imagem = `
        <div id="foto" class="div-img">
            ${getContatoImg(contato.urlFoto, "", 140)}
        </div>
    `;

    const nomeString = `
        <div class="form-group">
            <label for="nome">Nome</label>
            <input 
                id="nome" 
                class="form-control form-control-sm"
                type="text" 
                disabled="disabled" 
            />
        </div>
    `;

    const cidadeString = `
        <div class="form-group">
            <label for="cidade">Cidade</label>
            <input 
                id="cidade" 
                class="form-control form-control-sm"
                type="text" 
                disabled="disabled"
            />
        </div>
    `;

    const telefoneString = `
        <div class="form-group">
            <label for="telefone">Telefone</label>
            <input 
                id="telefone" 
                class="form-control form-control-sm telefone"
                type="text" 
                disabled="disabled"
            />
        </div>
    `;

    const whatsAppString = `
        <div class="form-group">
            <label for="whatsapp">WhatsApp</label>
            <input 
                id="whatsapp" 
                class="form-control form-control-sm whatsapp" 
                type="text" 
                disabled="disabled"
            />
        </div>
    `;

    const emailString = `
        <div class="form-group">
            <label for="email">E-mail</label>
            <input 
                id="email" 
                class="form-control form-control-sm" 
                type="email" 
                disabled="disabled"
            />
        </div>
    `;

    const empresaString = `
        <div class="form-group">
            <label for="empresa">Empresa</label>
            <input 
                id="empresa" 
                class="form-control form-control-sm" 
                type="text" 
                disabled="disabled"
            />
        </div>
    `;

    const buttonEdit = `
        <div class="row" style="margin: 0;">
            <button id="contatoEdit" type="button" class="btn btn-primary btn-block" disabled="disabled" onclick="editaContato()">
                Editar
            </button>
        </div>
    `;

    const buttonsUpdate = permiteEdicao ? `
        <div class="row">
            <div class="col-6" style="padding-right: 5px;">
                <button id="contatoCancel" type="button" class="btn btn-danger btn-block" onclick="cancelaEdicaoContato()" style="display: none;">
                    Cancelar
                </button>
            </div>

            <div class="col-6" style="padding-left: 5px;">
                <button id="contatoUpdate" type="button" class="btn btn-primary btn-block" onclick="salvaContato()" style="display: none;">
                    Salvar
                </button>
            </div>
        </div>
    ` : '';

    $("#div-info #contact").data("id", contato.id);
    $("#div-info #contact").empty().append(`
            ${imagem}
            
            ${nomeString}
            ${cidadeString}
            ${telefoneString}
            ${whatsAppString}
            ${emailString}
            ${empresaString}
            
            ${buttonEdit}
            ${buttonsUpdate}
    `);

    $("#contatoEdit").attr("disabled", !permiteEdicao);
    setContatoDivInfo(contato);
}

function setContatoDivInfo(contato) {
    const divChat = $("#contact");

    if (contato.urlFoto)
        divChat.find("#foto img").attr('src', contato.urlFoto)

    divChat.find("#nome").val(contato.nome).trigger('input');
    divChat.find("#cidade").val(contato.cidade).trigger('input');
    divChat.find("#telefone").val(contato.telefone).trigger('input');
    divChat.find("#whatsapp").val(contato.whatsapp).trigger('input');
    divChat.find("#email").val(contato.email).trigger('input');
    divChat.find("#empresa").val(contato.empresa).trigger('input');

    setMask();
}

function showDivChatEmpty() {
    $("#selected").hide();
    $("#empty").show();

    $(`#table-atendimentos tbody tr.selected`).removeClass("selected");
    $("#showInfoButton").empty();
    $("#showInfoButton").data('atendimentoId', 0);

    hideDivInfo();
    clearMessages();
}

function showDivInfo() {
    $("#div-chat").addClass("info");
    $("#div-info").show();
}

function hideDivInfo() {
    $("#div-chat").removeClass("info");
    $("#div-info").hide();
}

function editaContato() {
    permiteEdicaoContato();
}

function cancelaEdicaoContato() {
    setContatoDivInfo(getContatoStorage());
    bloqueiaEdicaoContato();

}

async function salvaContato() {
    const contactOnStorage = getContatoStorage();
    const contactDiv = $("#div-info #contact");
    const contato = {
        id: contactDiv.data("id"),
        nome: contactDiv.find("#nome").val(),
        cidade: contactDiv.find("#cidade").val(),
        telefone: contactDiv.find("#telefone").val(),
        email: contactDiv.find("#email").val(),
        whatsapp: contactDiv.find("#whatsapp").val().replace(/[^0-9]+/g, ''),
        empresa: contactDiv.find("#empresa").val()
    }

    const response = await apiPutAtualizaContato(contato);

    if (response && response.data && response.data.contato) {
        setContatoStorage(response.data.contato);

        await getAtendimentos({
            iniciarNaPagina1: true,
            fecharAtendimentoAberto: false,
            resetAtendimentoPagina: false,
            aguardar: awaitList * 2
        });

        await abreAtendimento({
            id: getAtendimentoId(),
            loading: false,
            aguardar: 0
        });

        bloqueiaEdicaoContato();
    }
}

function permiteEdicaoContato() {
    habilitaEdicaoContato();

    $("#contatoEdit").hide();
    $("#contatoCancel").show();
    $("#contatoUpdate").show();
}

function bloqueiaEdicaoContato() {
    desabilitaEdicaoContato();

    $("#contatoEdit").show();
    $("#contatoCancel").hide();
    $("#contatoUpdate").hide();
}

function desabilitaEdicaoContato() {
    habilitaDesabilitaEdicaoContato(false);
}

function habilitaEdicaoContato() {
    habilitaDesabilitaEdicaoContato(true);
}

function habilitaDesabilitaEdicaoContato(enable) {
    const contactDiv = $("#div-info #contact");

    contactDiv.find("#nome").attr('disabled', !enable);
    contactDiv.find("#cidade").attr('disabled', !enable);
    contactDiv.find("#telefone").attr('disabled', !enable);
    contactDiv.find("#email").attr('disabled', !enable);
    contactDiv.find("#whatsapp").attr('disabled', !enable);
    contactDiv.find("#empresa").attr('disabled', !enable);
}

//#region STORAGE
function getContatoStorage() {
    let contatoStorage = sessionStorage.getItem("atendimento-contato");
    if (!contatoStorage) return;

    contatoStorage = JSON.parse(contatoStorage);
    return contatoStorage;
}

function setContatoStorage(contato) {
    sessionStorage.setItem("atendimento-contato", JSON.stringify({
        id: contato.id,
        blipId: contato.blipId,
        nome: contato.nome,
        cidade: contato.cidade,
        telefone: contato.telefone,
        whatsapp: contato.whatsapp,
        email: contato.email,
        empresa: contato.empresa,
        canal: contato.canal,
        urlFoto: contato.urlFoto
    }));
}
//#endregion
