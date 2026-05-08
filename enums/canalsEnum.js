const canalEnum = require("./blip/canalEnum");

module.exports = [{
        id: "blip",
        nome: "Web Chat",
        canal: "0mn.io",
        blipEnum: canalEnum.blip
    },
    {
        id: "messeger",
        nome: "Messeger",
        canal: "messenger.gw.msging.net",
        blipEnum: canalEnum.messeger
    },
    {
        id: "telegram",
        canal: "telegram.gw.msging.net",
        nome: "Telegram",
        blipEnum: canalEnum.telegram
    },
    {
        id: "whatsapp",
        canal: "wa.gw.msging.net",
        nome: "WhatsApp",
        blipEnum: canalEnum.whatsapp
    }
];