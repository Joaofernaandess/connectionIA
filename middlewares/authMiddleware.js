const httpCodeEnum = require('../enums/httpCodeEnum');
const loginService = require('../services/loginService');
const logService = require('../services/common/logService');

module.exports = {
    ensureAuthenticated
};

async function ensureAuthenticated(req, res, next) {
    let authorization = req.headers['authorization'];

    if (!authorization && req.cookies) {
        const cookieToken = req.cookies.authToken;

        if (cookieToken) {
            try {
                authorization = decodeURIComponent(cookieToken);
            } catch (error) {
                authorization = cookieToken;
            }

            if (typeof authorization === 'string' && !authorization.toLowerCase().startsWith('bearer ')) {
                authorization = `Bearer ${authorization}`;
            }
        }
    }

    if (!authorization) {
        return respondUnauthorized(req, res, 'Usuário não autenticado.');
    }

    try {
        const validation = await loginService.valida(authorization);
        const statusCode = Number(validation?.httpCode) || httpCodeEnum.INTERNAL_SERVER_ERROR;

        if (statusCode === httpCodeEnum.OK) {
            return next();
        }

        if (statusCode === httpCodeEnum.UNAUTHORIZED) {
            return respondUnauthorized(
                req,
                res,
                validation?.message || 'Sessão expirada. Realize o login novamente.'
            );
        }

        return respondWithError(
            req,
            res,
            statusCode,
            validation?.message || 'Não foi possível validar a sessão do usuário.'
        );
    } catch (error) {
        logService.log(error);
        respondWithError(
            req,
            res,
            httpCodeEnum.INTERNAL_SERVER_ERROR,
            'Não foi possível validar a sessão do usuário.'
        );
    }
}

function respondUnauthorized(req, res, message) {
    if (isDocumentRequest(req)) {
        res.redirect('/');
        return;
    }

    res.status(httpCodeEnum.UNAUTHORIZED);
    res.json({
        mensagem: message
    });
}

function respondWithError(req, res, statusCode, message) {
    if (isDocumentRequest(req)) {
        res.status(statusCode).send(message);
        return;
    }

    res.status(statusCode);
    res.json({
        mensagem: message
    });
}

function isDocumentRequest(req) {
    if (req.headers && req.headers['sec-fetch-dest']) {
        return req.headers['sec-fetch-dest'] === 'document';
    }

    return !!req.accepts(['html']) && !req.xhr;
}
