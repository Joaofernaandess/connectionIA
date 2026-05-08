const canalEnum = require('../../enums/blip/canalEnum');
const formatoMensagemEnum = require('../../enums/formatoMensagemEnum');

const commonService = require('./commonService');

const emojiData = require('../../resource/emojiData').emojiData;

const openEncode = "<[{(";
const closeEncode = ")}]>";

const openEncode2 = "{%@";
const closeEncode2 = "@%}";

exports.encode = (type, textBlock) => encode(type, textBlock);
exports.decode = (type, textBlock) => decode(type, textBlock);
exports.decodeMarkDown = (canal, blocoTexto) => decodeMarkDown(canal, blocoTexto);
exports.transformTagLink = (content) => transformTagLink(content);
exports.decodeOwnerTags = (content) => decodeOwnerTags(content);

module.exports = exports;

function encode(tipo, textBlock) {
    if (!textBlock) return textBlock;
    if (typeof textBlock != "string") return textBlock;
    if (deveIgnorarCodificacao(tipo)) return textBlock;

    let newTextBlock = "";
    let arrayText = textBlock.split(" ");

    for (let i = 0; i < arrayText.length; i++) {
        const word = arrayText[i];
        const emoji = findInEmojis(word);

        if (emoji) {
            newTextBlock += `<[{(${emoji.n[0]})}]> `;
        } else {
            newTextBlock += `${encodeLetters(word)} `;
        }
    }

    return newTextBlock.trimEnd();
}

function decode(type, textBlock) {
    if (!textBlock) return textBlock;
    if (typeof textBlock != "string") return textBlock;
    if (deveIgnorarCodificacao(type)) return textBlock;

    let newTextBlock = "";
    let arrayText = textBlock.split(" ");

    for (let i = 0; i < arrayText.length; i++) {
        const string = arrayText[i];
        const isEmoji = string.indexOf(openEncode) >= 0 && string.indexOf(closeEncode) >= 0;
        let emoji = undefined;

        if (isEmoji) {
            emoji = findInEmojisName(string.replace(openEncode, "").replace(closeEncode, ""));
        }

        if (emoji) {
            newTextBlock += `${emoji.e} `
        } else {
            newTextBlock += `${string} `;
        }
    }

    return newTextBlock.trimEnd();
}

function encodeLetters(word) {
    let newWord = "";
    let _word = "";

    for (let x = 0; x < word.length; x++) {
        const letter = word[x];

        const singleQuotes = letter == `'`;
        const doubleQuotes = letter == `"`;

        if (singleQuotes || doubleQuotes) {
            newWord += `\\${letter}`;
        } else {
            _word += letter;
            newWord += letter;

            emoji = findInEmojis(_word);
            if (emoji) {
                newWord = newWord.replace(_word, `<[{(${emoji.n[0]})}]> `);
                _word = "";
            }
        }
    }

    return newWord;
}

function findInEmojis(emoji) {
    return emojiData.find(e => e.e == emoji);
}

function findInEmojisName(emoji) {
    const emojiFinded = findInEmojiTest(emoji);
    return emojiFinded;
}

function findInEmojiTest(search) {
    for (let e = 0; e < emojiData.length; e++) {
        const emoji = emojiData[e];

        if (emoji.n.length > 1) {
            for (let e2 = 0; e2 < emoji.n.length; e2++) {
                const emoji2 = emoji.n[e2];

                if (emoji2 == search) {
                    return emoji;
                }
            }
        } else {
            if (emoji.n == search) {
                return emoji;
            }
        }
    }
}

function obterFormatoId(tipo) {
    if (typeof tipo === "number") {
        return tipo;
    }

    if (tipo && typeof tipo === "object" && typeof tipo.id === "number") {
        return tipo.id;
    }

    return null;
}

function deveIgnorarCodificacao(tipo) {
    // Evita processar mídias (imagem, áudio/voz, documentos, replies) na codificação de emojis
    const formatoId = obterFormatoId(tipo);
    if (formatoId === formatoMensagemEnum.arquivo.id
        || formatoId === formatoMensagemEnum.resposta.id) {
        return true;
    }

    // Caso receba um objeto/conteúdo com tipo MIME, também desvia para não codificar
    const tipoMime = obterTipoMime(tipo);
    if (tipoMime && (tipoMime.includes("audio/") || tipoMime.includes("voice/")
        || tipoMime.includes("video/") || tipoMime.includes("image/") || tipoMime.includes("document")
        || tipoMime.includes("application/"))) {
        return true;
    }

    return false;
}

function obterTipoMime(tipo) {
    if (!tipo) return "";

    if (typeof tipo === "string") {
        return tipo.toLowerCase();
    }

    if (typeof tipo === "object") {
        if (typeof tipo.type === "string") return tipo.type.toLowerCase();
        if (typeof tipo.mime === "string") return tipo.mime.toLowerCase();
        if (typeof tipo.mimeType === "string") return tipo.mimeType.toLowerCase();
    }

    return "";
}

function decodeMarkDown(canal, blocoTexto) {
    let novoBlocoTexto = "";
    let verificacaoMarkDownIniciada = false;
    let palavraDetectadaMarkDown = "";
    let gravarLetraNoNovoBlocoTexto = true;
    let ignoreAtePosicao = 0;

    blocoTexto = blocoTexto.replace(/\n/g, `${openEncode2} <br> ${closeEncode2}`);

    for (let i = 0; i < blocoTexto.length; i++) {
        let letraOuPalavra = blocoTexto[i];
        let finalBlocoTexto = ((blocoTexto.length - 1) == i);

        if (ignoreAtePosicao > 0) {
            if (i <= ignoreAtePosicao) {
                continue;
            } else {
                ignoreAtePosicao = 0;
            }
        }

        gravarLetraNoNovoBlocoTexto = true;

        if (ehWhatsAppOrMessenger(canal)) {
            const markDownEncontrado = letraEhMarkDown(canal, letraOuPalavra);
            const markDownFoiEncontrado = markDownEncontrado != null;
            const markDownVerificaoFinalizada = (markDownFoiEncontrado && (palavraDetectadaMarkDown.length > markDownEncontrado.sizeMax));

            if (!verificacaoMarkDownIniciada) {
                verificacaoMarkDownIniciada = markDownFoiEncontrado;
            }

            if (verificacaoMarkDownIniciada) {
                gravarLetraNoNovoBlocoTexto = false;
            }

            if (markDownFoiEncontrado) {
                if (!markDownVerificaoFinalizada) {
                    palavraDetectadaMarkDown += letraOuPalavra;
                } else {
                    var fechamentoMarkDownEncontrado = (blocoTexto.substr(i, markDownEncontrado.sizeMax) == markDownEncontrado.symbol.repeat(markDownEncontrado.sizeMax));

                    if (fechamentoMarkDownEncontrado) {
                        ignoreAtePosicao = i + markDownEncontrado.sizeMax;
                        ignoreAtePosicao = ignoreAtePosicao > 0 ? ignoreAtePosicao - 1 : ignoreAtePosicao;

                        palavraDetectadaMarkDown = palavraDetectadaMarkDown + markDownEncontrado.symbol.repeat(markDownEncontrado.sizeMax);
                        palavraDetectadaMarkDown = palavraDetectadaMarkDown.split(markDownEncontrado.symbol).join("");

                        switch (markDownEncontrado.tag) {
                            case "b":
                                palavraDetectadaMarkDown = `${openEncode2} <b>${palavraDetectadaMarkDown}</b> ${closeEncode2}`;
                                break;
                            case "i":
                                palavraDetectadaMarkDown = `${openEncode2} <i>${palavraDetectadaMarkDown}</i> ${closeEncode2}`;
                                break;
                            case "s":
                                palavraDetectadaMarkDown = `${openEncode2} <s>${palavraDetectadaMarkDown}</s> ${closeEncode2}`;
                                break;
                            case "tt":
                                palavraDetectadaMarkDown = `${openEncode2} <span style="font-family:'Lucida Console', monospace">${palavraDetectadaMarkDown}</span> ${closeEncode2}`;
                                break;

                            default:
                                break;
                        }
                    }

                    letraOuPalavra = palavraDetectadaMarkDown;

                    palavraDetectadaMarkDown = "";
                    verificacaoMarkDownIniciada = false;
                    gravarLetraNoNovoBlocoTexto = true;
                }
            } else {
                if (verificacaoMarkDownIniciada || finalBlocoTexto) {
                    palavraDetectadaMarkDown += letraOuPalavra;
                }

                if (finalBlocoTexto) {
                    letraOuPalavra = palavraDetectadaMarkDown;
                    verificacaoMarkDownIniciada = false;
                    gravarLetraNoNovoBlocoTexto = true;
                }
            }
        }

        if (gravarLetraNoNovoBlocoTexto) {
            novoBlocoTexto = novoBlocoTexto + letraOuPalavra;
        }
    }

    return novoBlocoTexto;
}

function ehWhatsAppOrMessenger(canal) {
    return canal && canal.id &&
        (canal.id == canalEnum.whatsapp.id || canal.id == canalEnum.messeger.id);
}

function simbolosMarkDownEm1Caracter(canal) {
    return [{
        symbol: "*",
        sizeMax: 1,
        tag: "b"
    }, {
        symbol: "_",
        sizeMax: 1,
        tag: "i"
    }, {
        symbol: "~",
        sizeMax: 1,
        tag: "s"
    }, {
        symbol: "`",
        sizeMax: canal.id == canalEnum.whatsapp.id ? 3 : 1,
        tag: "tt"
    }];
}

function letraEhMarkDown(canal, letra) {
    const simbolos = simbolosMarkDownEm1Caracter(canal)
    return simbolos.find(x => x.symbol == letra);
}

function decodeOwnerTags(content) {
    content = replaceAll(content, `${openEncode2} `, '');
    content = replaceAll(content, ` ${closeEncode2}`, '');

    content = replaceAll(content, openEncode2, '');
    content = replaceAll(content, closeEncode2, '');

    return content;
}

function replaceAll(string, search, replace) {
    return string.split(search).join(replace);
}

function transformTagLink(content) {
    let linksFinded = commonService.getLinksInContent(content);

    if (linksFinded.length > 0) {
        for (let i = 0; i < linksFinded.length; i++) {
            const linkFinded = linksFinded[i];
            const tagA = `<a href='${linkFinded}' target='_blank'>${linkFinded}</a>`

            content = content.replace(linkFinded, tagA);
        }
    }

    return content;
}

function replaceAll(string, search, replace) {
    return string.split(search).join(replace);
}
