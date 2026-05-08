const sommusSistemasId = 1;

const axios = require('axios');
const qs = require('qs');

const ResponseHttp = require('../entities/responseHttp');

const httpCodeEnum = require('../enums/httpCodeEnum');

const atendenteService = require('./atendenteService');

exports.autentica = (username, password) => autentica(username, password);
exports.valida = (authorization) => valida(authorization);

module.exports = exports;

async function autentica(username, password) {
    const responseLogin = await apiSommusGestorLogin(username, password);

    if (!responseLogin.code) {
        return new ResponseHttp(httpCodeEnum.UNAUTHORIZED, "Ocorreu um erro interno ao realizar o login.");
    } else if (responseLogin.code != httpCodeEnum.OK) {
        return new ResponseHttp(responseLogin.code, "E-mail ou senha inválidos.");
    }

    const token = responseLogin.data.access_token;
    const responseGetEmpresas = await apiSommusGestorGetEmpresas(token);

    if (responseGetEmpresas.code && responseGetEmpresas.code != httpCodeEnum.OK) {
        return new ResponseHttp(responseGetEmpresas.code, "Ocorreu um erro ao validar os dados do usuário.");
    }

    const empresas = responseGetEmpresas.data.DadosEmpresas.Empresas;
    const usuarioLogado = responseGetEmpresas.data.UsuarioLogado;
    const sommusSistemas = empresas.filter(e => e.Id == sommusSistemasId);

    if (empresas.length == 0 || !sommusSistemas) {
        return new ResponseHttp(httpCodeEnum.UNAUTHORIZED, "Usuário não autorizado.");
    }

    const atendente = await atendenteService.getByEmail(usuarioLogado.Email);
    
    if (atendente.id > 0) {
        return new ResponseHttp(
            httpCodeEnum.OK,
            "Usuário autenticado com sucesso.", {
                "usuario": {
                    Email: usuarioLogado.Email,
                    Nome: usuarioLogado.Nome
                },
                "token": token,
                "atendente": {
                    blipId: atendente.blipId,
                    id: atendente.id,
                    email: atendente.email,
                    urlFoto: atendente.urlFoto
                }
            }
        );
    } else {
        return new ResponseHttp(httpCodeEnum.UNAUTHORIZED, "Usuário não cadastrado no BLiP.");
    }
}

async function valida(authorization) {
    const response = await apiSommusGestorValidaToken(authorization);
    const mensagem =
        typeof response.mensagem === 'string'
            ? response.mensagem
            : 'Ocorreu um erro ao validar o token.';

    return new ResponseHttp(response.code, mensagem, response.data);
}

// SommusBlipApiSommusGestor md5
async function apiSommusGestorLogin(username, password) {
    let response = null;

    const dados = {
        grant_type: "password",
        username: username,
        password: password
    };

    await axios({
            method: 'post',
            url: `${process.env.SOMMUSGESTOR_API}/api/security/token`,
            timeout: 10 * 1000,
            data: qs.stringify(dados)
        })
        .then(function (res) {
            response = {
                code: res.status,
                mensagem: "",
                data: res.data
            };
        })
        .catch(function (error) {
            if (error.response) {
                response = {
                    code: error.response.status,
                    mensagem: error.response.data
                }
            } else if (error.request) {
                response = {
                    code: 400,
                    mensagem: error.request
                }
            } else {
                response = {
                    code: 400,
                    mensagem: error.message
                }
            }
        });

    return response;
}

// API SOMMUSGESTOR
async function apiSommusGestorGetEmpresas(token) {
    let response = null;

    await axios({
            method: 'get',
            url: `${process.env.SOMMUSGESTOR_API}/api/empresas/actions/pelousuariologado?pagina=1&registrosPorPagina=100`,
            headers: {
                "Authorization": "Bearer " + token
            },
            timeout: 5000
        })
        .then(function (res) {
            response = {
                code: res.status,
                mensagem: "",
                data: res.data
            };
        })
        .catch(function (error) {
            if (error.response) {
                response = {
                    code: error.response.status,
                    mensagem: error.response.data
                }
            } else if (error.request) {
                response = {
                    code: 400,
                    mensagem: error.request
                }
            } else {
                response = {
                    code: 400,
                    mensagem: error.message
                }
            }
        });

    return response;
}

async function apiSommusGestorValidaToken(authorization) {
    let response = null;

    await axios({
            method: 'get',
            url: `${process.env.SOMMUSGESTOR_API}/api/homeapi/index`,
            timeout: 5000,
            headers: {
                "Authorization": authorization
            },
        })
        .then(function (res) {
            response = {
                code: res.status,
                mensagem: "",
                data: res.data
            };
        })
        .catch(function (error) {
            if (error.response) {
                response = {
                    code: error.response.status,
                    mensagem: error.response.data
                }
            } else if (error.request) {
                response = {
                    code: 400,
                    mensagem: error.request
                }
            } else {
                response = {
                    code: 400,
                    mensagem: error.message
                }
            }
        });

    return response;
}
