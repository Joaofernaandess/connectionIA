exports.isValidBrazilianCellphone = (phoneNumber) => isValidBrazilianCellphone(phoneNumber);

function isValidBrazilianCellphone(str) {
    const regex = /^55[1-9]{2}[6-9]{1}[0-9]{4}[0-9]{3,4}$/;
    return regex.test(str);
}