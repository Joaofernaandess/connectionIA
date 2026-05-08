const responseTypeEnum = require('../enums/responseTypeEnum');
const databaseService = require('../services/common/databaseService');

exports.getTotals = () => getTotals();
exports.getFinishedTotals = () => getFinishedTotals();
exports.getDailyCounts = () => getDailyCounts();
exports.getRatingHistory = () => getRatingHistory();
exports.getRatingAverage = () => getRatingAverage();
exports.getHourlyFlow = () => getHourlyFlow();
exports.getChannelDistribution = () => getChannelDistribution();
exports.getWaitingQueue = () => getWaitingQueue();
exports.getOngoingConversations = () => getOngoingConversations();
exports.getWaitingAverageSeconds = () => getWaitingAverageSeconds();
exports.getActiveTeamsCount = () => getActiveTeamsCount();
exports.getLastUpdate = () => getLastUpdate();

module.exports = exports;

async function runQuery(query) {
    const result = await databaseService.execute(query);

    if (result.type !== responseTypeEnum.success) {
        return [];
    }

    return result.content || [];
}

async function getTotals() {
    const query = `
        SELECT
            SUM(CASE WHEN DATE(a.data_hora) = CURDATE() THEN 1 ELSE 0 END) AS startedToday,
            SUM(CASE WHEN DATE(a.data_hora) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS startedYesterday,
            SUM(CASE WHEN a.status IN (1, 5) THEN 1 ELSE 0 END) AS waiting,
            SUM(CASE WHEN a.status IN (2, 3) THEN 1 ELSE 0 END) AS inProgress
        FROM atendimento a;
    `;

    const [row] = await runQuery(query);
    return row || { startedToday: 0, startedYesterday: 0, waiting: 0, inProgress: 0 };
}

async function getFinishedTotals() {
    const query = `
        SELECT
            SUM(CASE
                    WHEN finalizacao.data_hora >= CURDATE()
                     AND finalizacao.data_hora < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                    THEN 1 ELSE 0
                END) AS today,
            SUM(CASE
                    WHEN finalizacao.data_hora >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                     AND finalizacao.data_hora < CURDATE()
                    THEN 1 ELSE 0
                END) AS yesterday
          FROM (
                SELECT aa.atendimento_id, MAX(aa.data_hora) AS data_hora
                  FROM atendimento_atividade aa
                 WHERE aa.atividade = 3
                 GROUP BY aa.atendimento_id
               ) AS finalizacao;
    `;

    const [row] = await runQuery(query);
    if (!row) {
        return { today: 0, yesterday: 0 };
    }

    return {
        today: row.today || 0,
        yesterday: row.yesterday || 0
    };
}

async function getDailyCounts() {
    const query = `
        SELECT DATE(a.data_hora) AS dia,
               COUNT(*) AS total
          FROM atendimento a
         WHERE DATE(a.data_hora) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
         GROUP BY DATE(a.data_hora)
         ORDER BY DATE(a.data_hora);
    `;

    return await runQuery(query);
}

async function getRatingHistory() {
    const query = `
        SELECT DATE(a.data_hora) AS dia,
               AVG(a.nota) AS media
          FROM atendimento a
         WHERE a.nota IS NOT NULL
           AND DATE(a.data_hora) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
         GROUP BY DATE(a.data_hora)
         ORDER BY DATE(a.data_hora);
    `;

    return await runQuery(query);
}

async function getRatingAverage() {
    const query = `
        SELECT AVG(a.nota) AS media
          FROM atendimento a
         WHERE a.nota IS NOT NULL;
    `;

    const [row] = await runQuery(query);
    if (!row) {
        return null;
    }

    return row.media !== null ? row.media : null;
}

async function getHourlyFlow() {
    const query = `
        SELECT DATE(a.data_hora) AS dia,
               HOUR(a.data_hora) AS hora,
               COUNT(*) AS total
          FROM atendimento a
         WHERE DATE(a.data_hora) IN (CURDATE(), DATE_SUB(CURDATE(), INTERVAL 1 DAY))
         GROUP BY DATE(a.data_hora), HOUR(a.data_hora)
         ORDER BY DATE(a.data_hora), HOUR(a.data_hora);
    `;

    return await runQuery(query);
}

async function getChannelDistribution() {
    const query = `
        SELECT c.canal AS canalId,
               COUNT(DISTINCT aa.atendimento_id) AS total
          FROM atendimento_atividade aa
          JOIN atendimento a ON a.atendimento_id = aa.atendimento_id
          JOIN contato c ON c.contato_id = a.contato_id
         WHERE aa.atividade = 3
           AND DATE(aa.data_hora) = CURDATE()
         GROUP BY c.canal;
    `;

    return await runQuery(query);
}

async function getWaitingQueue() {
    const query = `
        SELECT a.atendimento_id AS id,
               c.nome AS contato,
               c.canal AS canalId,
               a.data_hora AS criadoEm
          FROM atendimento a
          JOIN contato c ON c.contato_id = a.contato_id
         WHERE a.status IN (1, 5)
         ORDER BY a.data_hora ASC
         LIMIT 5;
    `;

    return await runQuery(query);
}

async function getOngoingConversations() {
    const query = `
        SELECT a.atendimento_id AS id,
               c.nome AS contato,
               c.canal AS canalId,
               at.nome AS atendente,
               a.data_hora AS iniciadoEm
          FROM atendimento a
          JOIN contato c ON c.contato_id = a.contato_id
          LEFT JOIN atendente at ON at.atendente_id = a.atendente_id
         WHERE a.status IN (2, 3)
         ORDER BY a.data_hora ASC
         LIMIT 5;
    `;

    return await runQuery(query);
}

async function getWaitingAverageSeconds() {
    const query = `
        SELECT AVG(TIMESTAMPDIFF(SECOND, a.data_hora, NOW())) AS media
          FROM atendimento a
         WHERE a.status IN (1, 5);
    `;

    const [row] = await runQuery(query);
    return row ? row.media || 0 : 0;
}

async function getActiveTeamsCount() {
    const query = `
        SELECT COUNT(DISTINCT a.equipe_id) AS total
          FROM atendimento a
         WHERE a.status IN (2, 3)
           AND a.equipe_id IS NOT NULL;
    `;

    const [row] = await runQuery(query);
    return row ? row.total || 0 : 0;
}

async function getLastUpdate() {
    const query = `
        SELECT MAX(momento) AS atualizadoEm
          FROM (
                SELECT MAX(a.data_hora) AS momento
                  FROM atendimento a
                UNION ALL
                SELECT MAX(aa.data_hora) AS momento
                  FROM atendimento_atividade aa
               ) x;
    `;

    const [row] = await runQuery(query);
    return row ? row.atualizadoEm || null : null;
}
