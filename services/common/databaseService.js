const Response = require('../../entities/response');

const responseTypeEnum = require('../../enums/responseTypeEnum');

const logService = require('./logService');

const util = require('util')
const mysql = require('mysql2')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: process.env.DB_MULTIPLE_STATEMENTS,
    charset : process.env.DB_CHARSET
})

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }

    if (connection) connection.release()

    return
})

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query).bind(pool);

pool.execute = (query, params) => execute(query, params);

module.exports = pool;

function execute(query, params) {
    return run(query, params);
}

function run(query, params) {
    return new Promise(
        (resolve, reject) => {
            pool.getConnection((error, conn) => {
                if (error) {
                    reject(runError(error));
                } else {
                    conn.query(query, params, (error, rows) => {
                        conn.release();

                        if (error) {
                            reject(runError(error));
                        } else {
                            resolve(runSuccess(rows));
                        }
                    });
                }
            });
        }
    );
}

async function runError(error) {
    logService.log(error);

    return new Response(responseTypeEnum.error, errorSql(error));
}

async function runSuccess(rows) {
    return new Response(responseTypeEnum.success, "", rows);
}

function errorSql(error) {
    return error.sqlMessage ? error.sqlMessage : "Erro";
}
