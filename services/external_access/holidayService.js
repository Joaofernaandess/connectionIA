const mcache = require('memory-cache');
const axios = require('axios');

const timeOut = 60 * 60 * 1000;
const cacheKeyBase = '__blip__daysholiday';

const commonService = require('../common/commonService');

const ResponseHttp = require('../../entities/responseHttp');
const httpCodeEnum = require('../../enums/httpCodeEnum');

exports.isHoliday = (dateTime) => isHoliday(dateTime);

module.exports = exports;

async function isHoliday(dateTime) {
    const holiday = await getDateTimeIsHoliday(
        commonService.getDateFormatMySQL(
            dateTime ? dateTime : new Date()));

    if (holiday) {
        return new ResponseHttp(httpCodeEnum.OK, "", holiday);
    } else {
        return new ResponseHttp(httpCodeEnum.NOT_FOUND);
    }
}

async function getDateTimeIsHoliday(dateTime) {
    const cacheKey = `${cacheKeyBase}_${dateTime}`;
    let dayHoliday = mcache.get(cacheKey);

    if (dayHoliday) {
        return dayHoliday;
    } else {
        const response = await apiSommusGestorGetFeriado(dateTime);

        if (response.code == httpCodeEnum.OK && response.data && response.data.Feriado) {
            const isHoliday = response.data.Feriado.Id > 0;

            mcache.put(cacheKey, isHoliday, timeOut, () => {
                logService.log(`CACHE EXPIRADO - ${cacheKey}`);
            });

            return isHoliday;
        }
    }

    return null
}

async function apiSommusGestorGetFeriado(dateTime) {
    let response = null;

    await axios({
            method: 'get',
            url: `${process.env.SOMMUSGESTOR_API}/api/sommusblip/feriado?data=${dateTime}`,
            headers: {
                "Authorization": "1d3908edde3b55d5663a7831cf3acfff"
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