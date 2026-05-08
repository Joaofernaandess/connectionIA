/**
 * @typedef {httpCode: number, message: string, data: any} ResponseHttp
 * @type {ResponseHttp}
 */
module.exports = class ResponseHttp {
    constructor(httpCode = null, message = null, data = null) {
        this.httpCode = httpCode;
        this.message = message;
        this.data = data
    }
}