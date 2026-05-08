const moment = require('moment');
moment.locale('pt-br');

const canalEnum = require('../enums/blip/canalEnum');
const dashboardRepository = require('../repositories/dashboardRepository');

exports.getMetrics = () => getMetrics();

module.exports = exports;

async function getMetrics() {
    const [
        totals,
        finishedTotals,
        dailyCounts,
        ratingHistoryRows,
        ratingAverage,
        hourlyFlowRows,
        channelDistribution,
        waitingQueueRows,
        ongoingRows,
        waitingAverageSeconds,
        activeTeams,
        lastUpdate
    ] = await Promise.all([
        dashboardRepository.getTotals(),
        dashboardRepository.getFinishedTotals(),
        dashboardRepository.getDailyCounts(),
        dashboardRepository.getRatingHistory(),
        dashboardRepository.getRatingAverage(),
        dashboardRepository.getHourlyFlow(),
        dashboardRepository.getChannelDistribution(),
        dashboardRepository.getWaitingQueue(),
        dashboardRepository.getOngoingConversations(),
        dashboardRepository.getWaitingAverageSeconds(),
        dashboardRepository.getActiveTeamsCount(),
        dashboardRepository.getLastUpdate()
    ]);

    const startedToday = totals ? Number(totals.startedToday || 0) : 0;
    const startedYesterday = totals ? Number(totals.startedYesterday || 0) : 0;
    const waitingTotal = totals ? Number(totals.waiting || 0) : 0;
    const inProgressTotal = totals ? Number(totals.inProgress || 0) : 0;

    const finishedToday = finishedTotals ? Number(finishedTotals.today || 0) : 0;
    const finishedYesterday = finishedTotals ? Number(finishedTotals.yesterday || 0) : 0;

    const startedChange = startedToday - startedYesterday;
    const finishedChange = finishedToday - finishedYesterday;

    const dailyAverageSeries = buildDailySeries(dailyCounts);
    const dailyAverage = calculateDailyAverage(dailyAverageSeries.values);

    const ratingHistory = buildRatingSeries(ratingHistoryRows);
    const ratingTrend = calculateRatingTrend(ratingHistoryRows);

    const hourlyFlow = buildHourlyFlow(hourlyFlowRows);
    const finishedByChannel = buildChannelDistribution(channelDistribution);

    const waitingQueue = (waitingQueueRows || []).map(mapWaitingQueueItem);
    const ongoingConversations = (ongoingRows || []).map(mapOngoingConversation);

    return {
        highlights: {
            started: {
                total: startedToday,
                change: startedChange
            },
            finished: {
                total: finishedToday,
                change: finishedChange
            },
            waiting: {
                total: waitingTotal,
                change: null
            },
            inProgress: {
                total: inProgressTotal,
                change: null
            },
            dailyAverage,
            rating: {
                average: ratingAverage !== null ? Number(ratingAverage) : null,
                trend: ratingTrend
            },
            waitingAverageTime: formatAverageWaiting(waitingAverageSeconds),
            activeTeams: formatActiveTeams(activeTeams),
            lastUpdate: formatLastUpdate(lastUpdate),
            onlineTeams: activeTeams || 0
        },
        hourlyFlow,
        dailyAverageSeries,
        ratingHistory,
        finishedByChannel,
        waitingQueue,
        ongoingConversations
    };
}

function calculateDailyAverage(values) {
    if (!values || values.length === 0) {
        return 0;
    }

    const total = values.reduce((sum, value) => sum + (value || 0), 0);
    return Math.round(total / values.length);
}

function buildDailySeries(rows) {
    return buildFixedWindowSeries(rows, {
        defaultValue: 0,
        transformer: (item) => item.total || 0
    });
}

function buildRatingSeries(rows) {
    return buildFixedWindowSeries(rows, {
        defaultValue: null,
        transformer: (item) => {
            if (!item.media && item.media !== 0) {
                return null;
            }

            return parseFloat(parseFloat(item.media).toFixed(2));
        }
    });
}

function buildFixedWindowSeries(rows, options = {}) {
    const days = options.days || 7;
    const defaultValue = options.hasOwnProperty('defaultValue') ? options.defaultValue : 0;
    const transformer = options.transformer;

    const map = new Map();

    if (rows) {
        rows.forEach((item) => {
            const key = moment(item.dia).format('YYYY-MM-DD');
            map.set(key, item);
        });
    }

    const labels = [];
    const values = [];
    const start = moment().subtract(days - 1, 'day');

    for (let index = 0; index < days; index += 1) {
        const current = moment(start).add(index, 'day');
        const key = current.format('YYYY-MM-DD');
        const row = map.get(key);

        labels.push(formatDayLabel(current));

        if (row) {
            values.push(transformer ? transformer(row) : row.total || 0);
        } else {
            values.push(defaultValue);
        }
    }

    return { labels, values };
}

function calculateRatingTrend(rows) {
    if (!rows || rows.length === 0) {
        return null;
    }

    const todayRow = rows.find((item) => isSameDate(item.dia, new Date()));
    const yesterdayRow = rows.find((item) =>
        isSameDate(item.dia, moment().subtract(1, 'day').toDate())
    );

    if (!todayRow || !yesterdayRow) {
        return null;
    }

    const todayAverage = parseFloat(todayRow.media || 0);
    const yesterdayAverage = parseFloat(yesterdayRow.media || 0);

    return parseFloat((todayAverage - yesterdayAverage).toFixed(2));
}

function buildHourlyFlow(rows) {
    const labels = Array.from({ length: 24 }, (_, index) => `${index.toString().padStart(2, '0')}h`);
    const today = new Array(24).fill(0);
    const yesterday = new Array(24).fill(0);

    if (rows) {
        rows.forEach((item) => {
            const hour = item.hora;
            const value = item.total || 0;
            if (hour < 0 || hour > 23) {
                return;
            }

            if (isSameDate(item.dia, new Date())) {
                today[hour] = value;
            } else if (isSameDate(item.dia, moment().subtract(1, 'day').toDate())) {
                yesterday[hour] = value;
            }
        });
    }

    return { labels, today, yesterday };
}

function buildChannelDistribution(rows) {
    const distribution = new Map();

    if (rows) {
        rows.forEach((item) => {
            const channel = mapChannel(item.canalId);
            const current = distribution.get(channel.id) || { label: channel.name, total: 0 };
            current.total += item.total || 0;
            distribution.set(channel.id, current);
        });
    }

    const labels = [];
    const values = [];

    distribution.forEach((entry) => {
        labels.push(entry.label);
        values.push(entry.total);
    });

    const total = values.reduce((sum, value) => sum + value, 0);

    return { labels, values, total };
}

function mapWaitingQueueItem(item) {
    const openedAt = moment(item.criadoEm);
    const waitingSeconds = moment().diff(openedAt, 'seconds');

    return {
        name: item.contato || 'Contato sem nome',
        channel: mapChannel(item.canalId).name,
        channelId: item.canalId,
        time: openedAt.fromNow(),
        priority: definePriority(waitingSeconds)
    };
}

function mapOngoingConversation(item) {
    const startedAt = moment(item.iniciadoEm);
    const duration = moment.duration(moment().diff(startedAt));

    return {
        contact: item.contato || 'Contato sem nome',
        channel: mapChannel(item.canalId).name,
        channelId: item.canalId,
        agent: item.atendente || '—',
        duration: formatDuration(duration)
    };
}

function mapChannel(id) {
    const channel = Object.values(canalEnum).find((item) => item.id === id);
    if (!channel) {
        return { id: 0, name: 'Outro', idString: 'outro' };
    }

    return channel;
}

function definePriority(seconds) {
    if (seconds >= 600) {
        return 'Alta';
    }

    if (seconds >= 300) {
        return 'Média';
    }

    return 'Baixa';
}

function formatDuration(duration) {
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const parts = [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0'));
    return parts.join(':');
}

function formatAverageWaiting(seconds) {
    if (!seconds || seconds <= 0) {
        return 'Tempo médio 0m';
    }

    const duration = moment.duration(seconds, 'seconds');
    const minutes = Math.floor(duration.asMinutes());
    const secs = duration.seconds();

    if (minutes === 0) {
        return `Tempo médio ${secs}s`;
    }

    return `Tempo médio ${minutes}m ${secs}s`;
}

function formatActiveTeams(total) {
    if (!total || total <= 0) {
        return 'Nenhuma equipe em atendimento';
    }

    return `${total} equipe${total > 1 ? 's' : ''} em atendimento`;
}

function formatLastUpdate(date) {
    if (!date) {
        return 'menos de um minuto';
    }

    const relative = moment(date).fromNow();

    if (relative.startsWith('há ')) {
        return relative.replace('há ', '');
    }

    return relative;
}

function formatDayLabel(date) {
    return moment(date).format('DD/MM');
}

function isSameDate(first, second) {
    return moment(first).format('YYYY-MM-DD') === moment(second).format('YYYY-MM-DD');
}
