const moment = require('moment');
moment.locale("pt-br");

exports.formatoDataMensagens = (dataString) => formatoDataMensagens(dataString);
exports.formatoDataAtendimento = (dataString) => formatoDataAtendimento(dataString);
exports.round = (number, decimals) => round(number, decimals);
exports.isNull = (value, _defaut) => isNull(value, _defaut);
exports.sqlValueZeroForNull = (value) => sqlValueZeroForNull(value);
exports.sqlValueNullForZero = (value) => sqlValueNullForZero(value);
exports.sleep = (ms) => sleep(ms);
exports.getDateTimeFormatMySQL = (dateTime) => getDateTimeFormatMySQL(dateTime);
exports.getDateFormatMySQL = (date) => getDateFormatMySQL(date);
exports.hasLinksInContent = (content) => hasLinksInContent(content);
exports.getLinksInContent = (content) => getLinksInContent(content);
exports.formatWhatsAppWithDDI = (whatsapp) => formatWhatsAppWithDDI(whatsapp);
exports.getDiferencaEmHoras = (dataHoraInicio, dataHoraFim) => getDiferencaEmHoras(dataHoraInicio, dataHoraFim);
exports.getDiferencaEmMinutos = (dataInicio, dataFim) => getDiferencaEmMinutos(dataInicio, dataFim);

module.exports = exports;

function formatoDataMensagens(dataString) {
    return formataData(dataString);
}

function formatoDataAtendimento(dataAtendimento) {
    return formataData(dataAtendimento, true);
}

function formataData(data, ehAtendimento = false) {
    const ontem = moment().clone().add(-1, 'days');

    if (moment(data).isSame(moment(new Date(1, 1, 1, 0, 0, 0, 0))) || data === "") {
        return "";
    }

    try {
        if (moment().isSame(data, 'day')) {
            let dataFormatada = moment(data).format("HH:mm");
            return ehAtendimento ? dataFormatada : `Hoje às ${dataFormatada}` ;
        }

        if (moment().isSame(data, 'week')) {
            if (moment(data).format("L") === ontem.format("L")) {
                return `Ontem${ehAtendimento ? ',' : ' às' } ` + moment(data).format("HH:mm");
            }

            return moment(data).format("dddd às HH:mm");
        }

        let dataFormatada = moment(data).format("DD/MM/YYYY, HH:mm");
        dataFormatada = dataFormatada.replace(',', ' às');
        return dataFormatada;
    } catch (error) {
        return "";
    }
}

function round(number = 0, decimals) {
    if ((typeof number !== 'number') || (typeof decimals !== 'number'))
        return false

    var num_sign = number >= 0 ? 1 : -1;

    return parseFloat((Math.round((number * Math.pow(10, decimals)) + (num_sign * 0.0001)) / Math.pow(10, decimals)).toFixed(decimals));
}

function isNull(value, _default) {
    if (typeof value === 'undefined' || value === null || value === 'null') {
        return _default;
    } else {
        return value;
    }
}

function sqlValueZeroForNull(value) {
    return value > 0 ? value : "NULL";
}

function sqlValueNullForZero(value) {
    return value || value > 0 ? value : 0;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDateTimeFormatMySQL(date) {
    return new moment(date).format("YYYY-MM-DD HH:mm:ss");
}

function getDateFormatMySQL(date) {
    return new moment(date).format("YYYY-MM-DD");
}

function hasLinksInContent(content) {
    return getLinksInContent(content).length > 0;
}

function getLinksInContent(content) {
    const arrayWords = content.split(" ");
    return arrayWords.filter(w => w.includes("http"));
}

function formatWhatsAppWithDDI(whatsapp) {
    if (whatsapp.substring(0,2) === "55" && whatsapp.length > 11) 
        return whatsapp;

    return "55" + whatsapp;
}

/**
 *
 * @param dataHoraInicio {Date}
 * @param dataHoraFim {Date}
 * @returns {number}
 */
function getDiferencaEmHoras(dataHoraInicio, dataHoraFim) {
    const dataHoraInicioMoment = moment(dataHoraInicio);
    const dataHoraFimMoment = moment(dataHoraFim);
    return parseInt(Math.abs(dataHoraFimMoment - dataHoraInicioMoment) / 36e5);
}

function getDiferencaEmMinutos(dataInicio, dataFim) {
    const dataInicioMoment = moment(dataInicio);
    const dataFimMoment = moment(dataFim);
    return parseInt(Math.abs(dataFimMoment - dataInicioMoment) / 6e4)
}
