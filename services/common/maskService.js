const StringMask = require('string-mask');

exports.whatsapp = (string) => whatsapp(string);
exports.phone = (string) => phone(string);
exports.removeMask = (string) => removeMask(string);

function whatsapp(numeroString) {
    if (numeroString.length === 12) {
        numeroString = numeroString.substring(2)
        numeroString = numeroString.substring(0, 2) + "9" + numeroString.substring(2)
    } else if (numeroString.length === 13) {
        numeroString = numeroString.substring(2)
    }

    const formatter = new StringMask(numeroString.length === 11 ? '(00) 00000-0000' : '(00) 0000-0000');

    return formatter.apply(numeroString);
}

function phone(string) {
    if (string.length === 11 && string.substring(0, 1) === "0") {
        string = string.substring(1);
    }

    const formatter = new StringMask('(00) 0000-00000'); // 37 9882-62337

    return formatter.apply(string);
}

function removeMask(string) {
    return string.replace(/[^0-9]+/g, '');
}
