function textChatOnKeyDown(event) {
    if (event && event.keyCode === 13) {
        event.preventDefault();
    }
}

function textChatOnKeyUp(event) {
    let isRunning = isNull($("#recordTimerTimer").data("running"), false);
    if (isRunning) {
        return;
    }

    textChatSetSendButton();

    if (event && event.keyCode === 13) {
        sendTextChat();
        autosize("");
    }
}

function textChatSetSendButton() {
    let textChatContent = $("#chatText").val().trim();

    if (textChatContent.length > 0 || clipboardImageFile) {
        $("#recordButton").hide();
        $("#sendButton").show();
    } else {
        $("#recordButton").show();
        $("#sendButton").hide();
    }
}

function setChat() {
    $("#sendButton").off('click').on('click', () => {
        sendTextChat(document.getElementById("chatText"));
    });
}

async function sendTextChat() {
    const message = $("#chatText").val();
    let trimmed = message.trim();
    $("#chatText").val("");
    const file = clipboardImageFile;
    clipboardImageFile = null;
    if (typeof hideClipboardPreview === 'function')
        hideClipboardPreview();

    // Ignore pasted filenames when sending an image
    if (file) {
        const fname = file.name || '';
        if (trimmed === fname || trimmed.endsWith('/' + fname) || trimmed.endsWith('\\' + fname))
            trimmed = '';
    }

    if (!trimmed && !file)
        return;

    $("#chatText").addClass("disabled-with-backgroud-enable").attr("disabled", true);

    if (file) {
        await uploadClipboardImage(file);
    }

    if (trimmed) {
        const res = await apiPostEnviarMensagem(trimmed);

        if (res && res.status && (res.status === 202 || res.status === 200)) {
            const atendimentoId = getAtendimentoId();

            await abreAtendimento({
                id: atendimentoId,
                loading: false,
                aguardar: 0
            });

            if (hasMessagesUnanswered())
                removeMessagesUnanswered();
        } else {
            $("#chatText").val(trimmed);
        }
    }

    textChatSetSendButton();

    $("#chatText").removeClass("disabled-with-backgroud-enable").attr("disabled", false);
    $("#chatText").focus();
}

function hasMessagesUnanswered() {
    return $("#messagesUnanswered");
}

function removeMessagesUnanswered() {
    $("#messagesUnanswered").remove();
    getTicketTr().find("#countNewMessages").remove();
}

function setMessage(obj) {
    let mensagemHtml = "";
    let mensagemNotify = "";

    let formato = isNull(obj.formato.idString, "texto");
    let notificao = isNull(obj.notificao, false);
    let status = isNull(obj.status, 0);

    if (status === 0) {
        mensagemHtml = getMessageTextErroHtml(obj);
        mensagemNotify = getMessageTextNotify(obj);
    } else if (formato === "texto") {
        mensagemHtml = getMessageTextHtml(obj);
        mensagemNotify = getMessageTextNotify(obj);
    } else if (formato === "resposta") {
        if (!obj.respostaPara.id || !obj.respostaPara.mensagem) {
            mensagemHtml = getMessageTextHtml(obj);
        } else {
            mensagemHtml = getMessageReplyHtml(obj);
        }
        mensagemNotify = getMessageTextNotify(obj);
    } else if (formato === "arquivo") {
        mensagemHtml = getMessageFileHtml(obj);
        mensagemNotify = getMessageFileNotify(obj);

        if (!obj.element) {
            obj.element = createElementFile(obj.conteudo);
        }
    } else if (formato === "audio") {
        mensagemHtml = getMessageAudioHtml(obj);
        mensagemNotify = getMessageAudioNotify(obj);

        if (!obj.element) {
            obj.element = createElementAudio(obj.conteudo);
        }
    } else if (formato === "imagem") {
        mensagemHtml = getMessageImageHtml(obj);
        mensagemNotify = getMessageImageNotify(obj);

        if (!obj.element) {
            obj.element = createElementImage(obj.conteudo)
        }
    } else if (formato === "unanswered") {
        mensagemHtml = getMessageUnansweredHtml(obj.message);
    }

    $("#chatSpeechTBody").append(mensagemHtml);

    if (notificao && mensagemNotify && mensagemNotify.length > 0) showNotify("SommusBLiP", mensagemNotify);

    if (formato === "arquivo") {
        $(`#${obj.id} .bubble .txt`).prepend(obj.element);
    } else if (formato === "audio") {
        $(`#${obj.id} .bubble .txt`).prepend(obj.element);
    } else if (formato === "imagem") {
        $(`#${obj.id} .bubble .txt`).prepend(obj.element);
        $(`#${obj.id} .bubble .txt img`).off('click').on('click', () => {
            imgZoom(`#${obj.id} .bubble .txt img`);
        })
    } else if (formato === "resposta") {
        const messageDiv = document.getElementById(obj.id);

        if (messageDiv) {
            const replyTo = messageDiv.querySelector(".reply");
            if (replyTo && (obj.respostaPara.id || obj.respostaPara.mensagem)) {
                replyTo.addEventListener('click', (e) => {
                    let messageId = e.currentTarget.getAttribute('data-id');
                    let messageElement = document.getElementById(messageId);
                    if (messageElement) {
                        messageElement.scrollIntoView({behavior: "smooth"});
                        messageElement.classList.add('highlight');
                        setTimeout(() => { messageElement.classList.remove('highlight'); }, 1500);
                    }
                });
            }

            if (hasMediaContent(obj.conteudo)) {
                const $replyAttachment = $(`#${obj.id} .reply-attachment`);
                if ($replyAttachment.length) {
                    const attachmentType = getAttachmentRenderType(obj.conteudo);

                    if (attachmentType === "audio") {
                        $replyAttachment.prepend(createElementAudio(obj.conteudo));
                    } else if (attachmentType === "imagem") {
                        $replyAttachment.prepend(createElementImage(obj.conteudo));
                        $replyAttachment.find('img').off('click').on('click', function () {
                            imgZoom(this);
                        });
                    } else {
                        $replyAttachment.prepend(createElementFile(obj.conteudo));
                    }
                }
            }
        }
    }

    $("#chatSpeechTBody").scrollTop($('#chatSpeechTBody')[0].scrollHeight);
}

function getMessageUnansweredHtml(count) {
    let messagesString = count === 1 ? "mensagem" : "mensagens";
    let readString = count === 1 ? "respondida" : "respondidas"

    return `
        <p id="messagesUnanswered" style="text-align: center; margin: 0.3rem; padding: 0.3rem; background-color: #fff;">            
            ${count} ${messagesString} não ${readString}
        </p>
    `;
}

function clearMessages() {
    $("#chatSpeechTBody").empty();
}

function getAtendimentoId() {
    return $("#showInfoButton").data('atendimentoId');
}

function getTicketTr() {
    return $("#table-atendimentos").find(`tr#${getAtendimentoId()}`);
}

function getMessageBaseHtml(obj, content = "") {
    let recebido = obj.recebido;
    let id = isNull(obj.id, "");
    let alt = recebido ? "" : "alt";
    let arrowLeft = `<span class="arrow"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 13" width="8" height="13"><path opacity=".13" fill="#0000000" d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path><path fill="currentColor" d="M1.533 2.568L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path></svg></span>`;
    let arrowRight = `<span class="arrow right"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 13" width="8" height="13"><path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path><path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path></svg></span>`;

    if (id) {
        id = `id="${id}"`;
    }

    return `
        <div ${id} class="speech-wrapper">            
            ${recebido ? arrowLeft : arrowRight}

            <div class="bubble ${alt}">             
                <div class="txt">   
                    ${content}
                </div>
            </div>
        </div>
    `;
}

function getMessageTextHtml(obj) {
    let recebido = obj.recebido;
    let alt = recebido ? "" : "alt";

    return getMessageBaseHtml(obj, `        
            <p class="name ${alt}" >
                ${isNull(obj.phone, "")}
                <span>${isNull(obj.user, "")}</span>
            </p>
            <p class="message">
                ${isNull(obj.conteudo, "")}
            </p>
            <p class="timestamp">${isNull(obj.dataHora, "")}  
                ${recebido ? `` : `<span>${getStatus()}</span>`}
            </p>        
    `);
}

function getMessageTextErroHtml(obj) {
    let recebido = obj.recebido;
    let alt = recebido ? "" : "alt";

    return getMessageBaseHtml(obj, `
        <p class="name ${alt}">
            ${isNull(obj.phone, "")}
            <span>${isNull(obj.user, "")}</span>
        </p>
        <p class="message">
            <span style="color: red;">Essa mensagem foi recebida, mas não foi possível processá-la.</span>
        </p>
        <p class="timestamp">${isNull(obj.dataHora, "")}  
            ${recebido ? `` : `<span>${getStatus()}</span>`}
        </p>        
    
    `);
}

function getMessageReplyHtml(obj) {
    let recebido = obj.recebido;
    let alt = recebido ? "" : "alt";

    return getMessageBaseHtml(obj, `
        <p class="name ${alt}">
            ${isNull(obj.phone, "")}
            <span>${isNull(obj.user, "")}</span>
        </p>
        <div class="reply" data-id=${obj.respostaPara.id}>
            <span>Resposta à:</span>
            <p class="reply-to">
                ${isNull(obj.respostaPara.mensagem, "")}
            </p>
            ${getReplyPreviewHtml(obj.respostaPara)}
        </div>
        ${getReplyMessageBody(obj)}
    `);
}

function getReplyMessageBody(obj) {
    if (hasMediaContent(obj.conteudo)) {
        const caption = getAttachmentCaptionHtml(obj.conteudo);
        const attachmentType = getAttachmentRenderType(obj.conteudo);

        return `
            ${caption}
            <div class="reply-attachment" data-attachment-type="${attachmentType}"></div>
        `;
    }

    return `
        <p class="message">
            ${isNull(obj.conteudo, "")}
        </p>
    `;
}

function getReplyPreviewHtml(respostaPara = {}) {
    if (!respostaPara.preview || !respostaPara.preview.conteudo) {
        return "";
    }

    const preview = respostaPara.preview;
    const content = preview.conteudo;
    const type = (preview.tipo || getAttachmentRenderType(content) || "").toLowerCase();
    const name = preview.nome || content.name || content.title || content.filename || "";

    if (type === "imagem" && content.uri) {
        return `
            <div class="reply-preview reply-preview--image">
                <img src="${content.uri}" alt="${name}" />
                ${name ? `<span class="reply-preview__name">${name}</span>` : ""}
            </div>
        `;
    }

    if (!content.uri && !name) {
        return "";
    }

    return `
        <div class="reply-preview reply-preview--file">
            <span class="reply-preview__icon">${getReplyPreviewFileIcon()}</span>
            ${name ? `<span class="reply-preview__name" title="${name}">${name}</span>` : ""}
        </div>
    `;
}

function getMessageTextNotify(obj) {
    return `
        ${obj.dataHora} - ${obj.user ? obj.user + ' - ' : ''} ${obj.message}
    `;
}

function getAttachmentCaptionHtml(conteudo) {
    const caption = getAttachmentCaption(conteudo);

    if (!caption) {
        return "";
    }

    const escapedCaption = escapeHtml(caption);

    return `
        <p class="message attachment-caption">
            ${escapedCaption}
        </p>
    `;
}

function getAttachmentCaption(conteudo) {
    if (!conteudo) {
        return "";
    }

    const candidates = [
        conteudo.text,
        conteudo.caption,
        conteudo.description,
        conteudo.body,
        conteudo.label
    ];

    for (let i = 0; i < candidates.length; i++) {
        const value = candidates[i];
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }

    return "";
}

function escapeHtml(text) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = `${text}`;
    return tempDiv.innerHTML;
}

function hasMediaContent(conteudo) {
    return conteudo && typeof conteudo === "object" && !!conteudo.uri;
}

function getAttachmentRenderType(conteudo = {}) {
    if (!conteudo || typeof conteudo !== "object") {
        return "";
    }

    const type = ((conteudo.type || conteudo.mimeType || "") + "").toLowerCase();

    if (type.includes("image")) {
        return "imagem";
    }

    if (type.includes("audio") || type.includes("voice")) {
        return "audio";
    }

    if (type.includes("video")) {
        return "arquivo";
    }

    if (type.includes("application")) {
        return "arquivo";
    }

    if (!type && typeof conteudo.uri === "string") {
        const resource = conteudo.uri.split('?')[0];
        const extension = resource.split('.').pop();

        if (extension) {
            const normalized = extension.toLowerCase();

            if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(normalized)) {
                return "imagem";
            }

            if (["mp3", "wav", "ogg", "aac", "m4a"].includes(normalized)) {
                return "audio";
            }
        }
    }

    return conteudo.uri ? "arquivo" : "";
}

function getMessageFileHtml(obj) {
    let me = isNull(obj.me, false);
    const caption = getAttachmentCaptionHtml(obj.conteudo);

    return getMessageBaseHtml(obj, `        
            ${caption}
            <p class="timestamp">
                ${isNull(obj.dataHora, "")}  
                ${me ? `<span>${getStatus()}</span>` : `` }
            </p>        
    `);
}

function getMessageFileNotify(obj) {
    return `
        ${obj.dataHora} - ${obj.user ? obj.user + ' - ' : ''} Novo arquivo
    `;
}

function getMessageAudioHtml(obj) {
    let me = isNull(obj.me, false);
    const caption = getAttachmentCaptionHtml(obj.conteudo);

    return getMessageBaseHtml(obj, `        
            ${caption}
            <p class="timestamp">
                ${isNull(obj.dataHora, "")}  
                ${me ? `<span>${getStatus()}</span>` : `` }
            </p>        
    `);
}

function getMessageAudioNotify(obj) {
    return `
        ${obj.dataHora} - ${obj.user ? obj.user + ' - ' : ''} Novo aúdio
    `;
}

function getMessageImageHtml(obj) {
    let me = isNull(obj.me, false);
    const caption = getAttachmentCaptionHtml(obj.conteudo);

    return getMessageBaseHtml(obj, `        
            ${caption}
            <p class="timestamp">
                ${isNull(obj.dataHora, "")}  
                ${me ? `<span>${getStatus()}</span>` : `` }
            </p>        
    `);
}

function getMessageImageNotify(obj) {
    return `
        ${obj.dataHora} - ${obj.user ? obj.user + ' - ' : ''} Nova imagem
    `;
}

function getReplyPreviewFileIcon() {
    return `
        <svg height="16" width="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M447.229,67.855h-43.181v-43.18C404.049,11.103,392.944,0,379.379,0H64.771C51.2,0,40.097,11.103,40.097,24.675V419.47 c0,13.571,11.103,24.675,24.675,24.675h43.181v43.181c0,13.571,11.098,24.675,24.675,24.675h209.729 c13.565,0,32.762-7.612,42.638-16.908l68.929-64.882c9.888-9.296,17.969-28.012,17.969-41.583l0.012-296.096 C471.904,78.959,460.8,67.855,447.229,67.855z M107.951,92.531v333.108h-43.18c-3.343,0-6.168-2.825-6.168-6.168V24.675 c0-3.343,2.825-6.168,6.168-6.168H379.38c3.337,0,6.168,2.825,6.168,6.168v43.181H132.626 C119.049,67.856,107.951,78.959,107.951,92.531z M441.24,416.737l-68.929,64.877c-1.412,1.327-3.251,2.628-5.281,3.867v-56.758 c0-4.238,1.709-8.051,4.528-10.888c2.844-2.819,6.656-4.533,10.894-4.533h61.718C443.213,414.602,442.233,415.799,441.24,416.737z M453.385,388.626c0,1.832-0.334,3.954-0.839,6.168h-70.095c-18.721,0.037-33.89,15.206-33.928,33.928v64.024 c-2.202,0.445-4.324,0.746-6.168,0.746H132.626v0.001c-3.35,0-6.168-2.825-6.168-6.168V92.53c0-3.343,2.819-6.168,6.168-6.168 h314.602c3.343,0,6.168,2.825,6.168,6.168L453.385,388.626z" fill="currentColor"></path>
        </svg>
    `;
}


function getStatus() {
    return getDoubleCheckOk();
}

function getDoubleCheckOk() {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15">
            <path fill="#4fc3f7" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
        </svg>
    `;
}

function getDoubleCheck() {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15">
            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
        </svg>
    `;
}

function getSingleCheck() {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15">
            <path fill="currentColor" d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
        </svg>
    `;
}

function getWaiting() {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15">
            <path fill="currentColor" d="M9.75 7.713H8.244V5.359a.5.5 0 0 0-.5-.5H7.65a.5.5 0 0 0-.5.5v2.947a.5.5 0 0 0 .5.5h.094l.003-.001.003.002h2a.5.5 0 0 0 .5-.5v-.094a.5.5 0 0 0-.5-.5zm0-5.263h-3.5c-1.82 0-3.3 1.48-3.3 3.3v3.5c0 1.82 1.48 3.3 3.3 3.3h3.5c1.82 0 3.3-1.48 3.3-3.3v-3.5c0-1.82-1.48-3.3-3.3-3.3zm2 6.8a2 2 0 0 1-2 2h-3.5a2 2 0 0 1-2-2v-3.5a2 2 0 0 1 2-2h3.5a2 2 0 0 1 2 2v3.5z"></path>
        </svg>
    `;
}

function getWaiting() {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15">
            <path fill="currentColor" d="M9.75 7.713H8.244V5.359a.5.5 0 0 0-.5-.5H7.65a.5.5 0 0 0-.5.5v2.947a.5.5 0 0 0 .5.5h.094l.003-.001.003.002h2a.5.5 0 0 0 .5-.5v-.094a.5.5 0 0 0-.5-.5zm0-5.263h-3.5c-1.82 0-3.3 1.48-3.3 3.3v3.5c0 1.82 1.48 3.3 3.3 3.3h3.5c1.82 0 3.3-1.48 3.3-3.3v-3.5c0-1.82-1.48-3.3-3.3-3.3zm2 6.8a2 2 0 0 1-2 2h-3.5a2 2 0 0 1-2-2v-3.5a2 2 0 0 1 2-2h3.5a2 2 0 0 1 2 2v3.5z"></path>
        </svg>
    `;
}

function mensagemExiste(id) {
    return $("#chatSpeechTBody").find(`#${id}`).length > 0;
}

async function abreAtendimentoPeloId(id) {
    await abreAtendimento({
        id: id,
        loading: false,
        aguardar: 0
    });
}

async function abreAtendimento(params) {
    id = params.id;
    loading = params.loading;
    aguardar = isNull(params.aguardar, 0);
    manterListaMensagens = isNull(params.manterListaMensagens, 0);

    const atendimento = await getAtendimento(id, true);

    if (aguardar > 0)
        await sleep(aguardar);

    if (atendimento) {
        showDivChat(atendimento, manterListaMensagens, loading);

        await goToEndMessages();
        if (document.hasFocus()) {
            resetUnreadNotifications();
        }
    } else {
        return;
    }
}

async function getAtendimento(id, message = false) {
    const resAtendimento = await apiGetAtendimento(id);

    if (resAtendimento.status !== 200 || !resAtendimento.data || !resAtendimento.data.atendimento) {
        if (message) {
            alertError(resAtendimento.data.mensagem);
        }

        return null
    }

    return resAtendimento.data.atendimento;
}

async function showDivChat(atendimento, manterListaMensagens, loading) {
    if (!existTrChat(atendimento))
        return;

    await setChatMessages(atendimento, manterListaMensagens, loading);
    setChatHeadShow(atendimento);
    setDivMessagesShow();
    setChatButtons(atendimento);
    disabledEnableChat(atendimento);
    mobileOpenChat();
}

function existTrChat(ticket) {
    let ticketTr = $(`#table-atendimentos tbody tr#${ticket.id}`);

    if (!ticketTr) return false;
    return true;
}

function setChatHeadShow(atendimento) {
    setSelectedTicket(atendimento.id);
    setContatoStorage(atendimento.contato);

    $("#showInfoButton").empty().append(`
        <div class="row no-gutters div-contato-info align-items-center">
            <div class="div-img">
                ${getContatoImg(atendimento.contato.urlFoto, "", 30)}
            </div>
            <div class="div-info pl-1">
                <p class="title">
                    <b>${atendimento.contato.nome}</b>
                </p>
            </div>
        </div>
    `);

    $("#chatSubtitle").html(`
        #${isNull(atendimento.id, 0)} |
        ${moment(atendimento.dataHora).format('DD/MM/YYYY HH:mm:ss')}
        <span class="desktop-only"> | ${atendimento.status.description} | ${atendimento.contato.canal.name}</span>
    `);

    $("#showInfoButton").data('atendimentoId', atendimento.id);
    $("#showInfoButton").off('click').on('click', () => {
        if ($("#div-info").is(":visible")) {
            hideDivInfo();
        } else {
            setDivInfo(atendimento);
            showDivInfo();
        }
    });

    if ($("#div-info").is(":visible")) {
        setDivInfo(atendimento);
        showDivInfo();
    }
}

function setSelectedTicket(atendimentoId) {
    $(`#table-atendimentos tbody tr.selected`).removeClass("selected");
    $(`#table-atendimentos tbody tr#${atendimentoId}`).addClass("selected");
}

function setDivMessagesShow() {
    $("#selected").show();
    $("#empty").hide();
}

function disabledEnableChat(atendimento) {
    const closed = (atendimento.status.id === "closed");
    const waiting = (atendimento.status.id === "waiting");
    const atenderBtn = $("#atenderButton");
    const transferirBtn = $("#transferirButton");
    const finalizarBtn = $("#finalizarButton");

    atenderBtn.attr("disabled", true);

    if (atendimento.desabilitaChatRegraWhatsApp) {
        disabledChat();
        if (!closed) finalizarBtn.attr("disabled", false);
    } else if (closed) {
        disabledChat();
    } else if (waiting) {
        disabledChat();
        atenderBtn.attr("disabled", !atendimento.permiteAtender);
        transferirBtn.attr("disabled", false);
    } else if (atendimento.desabilitaChatRegraAtendente || atendimento.desabilitaChatRegraNotificaoAtiva) {
        disabledChat();
    } else {
        enabledChat();
        $("#chatText").focus();
    }

    if (atendimento.habilitaTransferencia) {
        transferirBtn.attr("disabled", false);
    }
}

function setChatButtons(atendimento) {
    $("#atenderButton").off('click').on('click', () => {
        atender(atendimento.id, atendimento.contato.id)
    });

    $("#transferirButton").off('click').on('click', () => {
        transferencia(atendimento.id);
    });

    $("#finalizarButton").off('click').on('click', () => {
        finalizar(atendimento.id);
    });
}

function ticketWaiting() {
    $("#transferirButton").attr("disabled", true);
}

function ticketStart() {
    $("#transferirButton").attr("disabled", false);
}

function disabledChat() {
    $("#emojiButton").attr("disabled", true);
    $("#fileButton").attr("disabled", true);
    $("#file").attr("disabled", true);
    $("#chatText").attr("disabled", true);
    $("#recordButton").attr("disabled", true);
    $("#recordSendButton").attr("disabled", true);
    $("#recordCancelButton").attr("disabled", true);
    $("#sendButton").attr("disabled", true);
    $("#transferirButton").attr("disabled", true);
    $("#finalizarButton").attr("disabled", true);
}

function enabledChat() {
    $("#emojiButton").attr("disabled", false);
    $("#fileButton").attr("disabled", false);
    $("#file").attr("disabled", false);
    $("#chatText").attr("disabled", false);
    $("#recordButton").attr("disabled", false);
    $("#recordSendButton").attr("disabled", false);
    $("#recordCancelButton").attr("disabled", false);
    $("#sendButton").attr("disabled", false);
    $("#transferirButton").attr("disabled", false);
    $("#finalizarButton").attr("disabled", false);

    ticketStart();
}

async function setChatMessages(atendimento, manterListaMensagens = false, loading = false) {
    const mensagens = atendimento.mensagens;

    if (!mensagens)
        return;

    if (!manterListaMensagens)
        clearMessages();

    if (mensagens.length > 0) {
        for (let i = 0; i < mensagens.length; i++) {
            const mensagem = mensagens[i];

            if (mensagemExiste(mensagem.id))
                continue;

            setMessage(mensagem);

            if (atendimento.quantidadeMensagensNaoRespondidas && (i + 1) < mensagens.length &&
                mensagens[i + 1].id === atendimento.quantidadeMensagensNaoRespondidas) {

                setMessage({
                    formato: {
                        idString: "unanswered"
                    },
                    message: atendimento.quantidadeMensagensNaoRespondidas
                });
            }
        }
    }
}

async function goToEndMessages() {
    await sleep(300);

    const height = $("#chatSpeechTBody")[0].scrollHeight;
    $("#chatSpeechTBody").scrollTop(height)
}
