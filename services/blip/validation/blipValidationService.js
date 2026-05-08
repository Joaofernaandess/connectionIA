exports.isWhatsappAccountString = (str) => isWhatsappAccountString(str);

function isWhatsappAccountString(str) {
    const regex = /^([0-9]){12,13}@wa.gw.msging.net/g;
    return regex.test(str);
}
