const fs = require('fs');
const path = require('path');
const moment = require('moment');

const showLog = true;
const saveLog = false;

exports.log = (content) => log(content);
exports.log2 = (content) => log2(content);

module.exports = exports;

function log(content) {
    const dateTime = moment().format();

    if (showLog) {
        const linhaLog = `--> SommusBLiP-web - ${dateTime} - ${content}`;

        console.log('\x1b[36m%s\x1b[0m', linhaLog);

        if (saveLog) {
            logFile(linhaLog);
        }
    }
}

function logFile(novoConteudo) {
    let conteudo = "";

    if (!novoConteudo)
        return;

    const arquivoNome = moment().format("YYYYMMDD"); // moment().format("YYYYMMDDHHmmss");
    const diretorio = path.resolve(__dirname, "../../", "log");

    if (!fs.existsSync(diretorio))
        fs.mkdirSync(diretorio);

    const arquivo = `${diretorio}\\${arquivoNome}.txt`;

    if (fs.existsSync(arquivo))
        conteudo = fs.readFileSync(arquivo);

    novoConteudo = removeAspasNovoConteudo(JSON.stringify(novoConteudo));

    conteudo = conteudo + novoConteudo + "\n";

    fs.writeFileSync(arquivo, conteudo);
}

function log2(content) {
    const dateTime = moment().format();
    const linhaLog = `--> SommusBLiP-web - DEV - ${dateTime} - ${content}`;
    
    console.log('\x1b[31m%s\x1b[0m', linhaLog);

    logFile2(content);
}

function logFile2(novoConteudo) {
    let conteudo = "";

    if (!novoConteudo)
        return;

    const arquivoNome = moment().format("YYYYMMDD"); // moment().format("YYYYMMDDHHmmss");
    const diretorio = path.resolve(__dirname, "../../", "log");

    if (!fs.existsSync(diretorio))
        fs.mkdirSync(diretorio);

    const arquivo = `${diretorio}\\${arquivoNome}_2.txt`;

    if (fs.existsSync(arquivo))
        conteudo = fs.readFileSync(arquivo);

    novoConteudo = removeAspasNovoConteudo(JSON.stringify(novoConteudo));

    conteudo = conteudo + novoConteudo + "\n";

    fs.writeFileSync(arquivo, conteudo);
}

function removeAspasNovoConteudo(novoConteudo) {
    const primeiroCaracter = novoConteudo.substr(0, 1);
    const ultimoCaracter = novoConteudo.substr(novoConteudo.length - 1, 1);

    if (primeiroCaracter == '"' && ultimoCaracter == '"') {
        return novoConteudo.substr(1, novoConteudo.length - 2);
    }

    return novoConteudo;
}