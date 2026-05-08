const responseTypeEnum = require('../enums/responseTypeEnum');

module.exports = class Response {
    constructor(type = null, message = null, content = null) {
        this.type = type;
        this.message = message;
        this.content = content
    }

    reset() {
        this.type = responseTypeEnum.none;
        this.message = "";
        this.content = undefined;
    }
}