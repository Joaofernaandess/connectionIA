(function () {
    let dashboardData = null;
    let charts = {
        flow: null,
        dailyAverage: null,
        rating: null
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('dashboard-scrollable');
        window.addEventListener('beforeunload', removeScrollClass, { once: true });
        window.addEventListener('pagehide', removeScrollClass, { once: true });
        loadDashboard();
        setupRefreshButton();
    });

    function removeScrollClass() {
        document.body.classList.remove('dashboard-scrollable');
    }

    async function loadDashboard() {
        toggleRefreshButton(true);

        const token = getJToken();

        if (!token) {
            logoff();
            return;
        }

        try {
            const response = await fetch('/dashboard/dados', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logoff();
                    return;
                }

                throw new Error('Resposta inválida do servidor');
            }

            dashboardData = await response.json();
            renderDashboard();
        } catch (error) {
            console.error('Erro ao carregar o dashboard', error);
            displayErrorState();
        } finally {
            toggleRefreshButton(false);
        }
    }

    function renderDashboard() {
        if (!dashboardData) {
            return;
        }

        updateHighlights();
        renderCharts();
        populateQueues();
    }

    function updateHighlights() {
        const { highlights } = dashboardData;
        if (!highlights) {
            return;
        }

        setCount('startedCount', highlights.started.total);
        setCount('finishedCount', highlights.finished.total);
        setCount('waitingCount', highlights.waiting.total);
        setCount('inProgressCount', highlights.inProgress.total);

        updateChangeIndicator('startedChange', highlights.started.change);
        updateChangeIndicator('finishedChange', highlights.finished.change);
        updateChangeIndicator('waitingChange', highlights.waiting.change);
        updateChangeIndicator('inProgressChange', highlights.inProgress.change);

        setText('dailyAverageValue', `${formatNumber(highlights.dailyAverage)} conversas`);

        const ratingAverage = typeof highlights.rating.average === 'number' ? highlights.rating.average : null;
        if (ratingAverage === null) {
            setText('ratingValue', '--');
        } else {
            setText('ratingValue', ratingAverage.toFixed(1).replace('.', ','));
        }
        setText('ratingTrend', formatTrend(highlights.rating.trend));

        setText('waitingAverageTime', highlights.waitingAverageTime || 'Tempo médio 0m');
        setText('activeTeams', highlights.activeTeams || '--');
        setText('lastUpdateValue', highlights.lastUpdate || '--');
        setText('onlineTeams', formatNumber(highlights.onlineTeams || 0));
    }

    function renderCharts() {
        renderFlowChart();
        renderDailyAverageChart();
        renderRatingChart();
    }

    function renderFlowChart() {
        const canvas = document.getElementById('flowChart');
        if (!canvas || typeof Chart === 'undefined') {
            return;
        }

        const flow = dashboardData.hourlyFlow;
        if (!flow) {
            return;
        }

        destroyChart('flow');

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

        charts.flow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: flow.labels,
                datasets: [
                    {
                        label: 'Hoje',
                        data: flow.today,
                        borderColor: '#2563eb',
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#2563eb'
                    },
                    {
                        label: 'Ontem',
                        data: flow.yesterday,
                        borderColor: '#94a3b8',
                        borderDash: [6, 6],
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(148, 163, 184, 0.2)' }
                    }
                },
                plugins: {
                    legend: {
                        align: 'start',
                        labels: { usePointStyle: true, boxWidth: 12 }
                    }
                }
            }
        });
    }

    function renderDailyAverageChart() {
        const canvas = document.getElementById('dailyAverageChart');
        if (!canvas || typeof Chart === 'undefined') {
            return;
        }

        const series = dashboardData.dailyAverageSeries;
        if (!series) {
            return;
        }

        destroyChart('dailyAverage');

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 240);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');

        charts.dailyAverage = new Chart(ctx, {
            type: 'line',
            data: {
                labels: series.labels,
                datasets: [
                    {
                        label: 'Conversas concluídas',
                        data: series.values,
                        borderColor: '#0ea5e9',
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointBackgroundColor: '#0ea5e9'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: false,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(148, 163, 184, 0.2)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function renderRatingChart() {
        const canvas = document.getElementById('ratingChart');
        if (!canvas || typeof Chart === 'undefined') {
            return;
        }

        const highlights = dashboardData.highlights;
        if (!highlights || !highlights.rating) {
            return;
        }

        destroyChart('rating');

        const ratingAverage = typeof highlights.rating.average === 'number' ? highlights.rating.average : 0;
        const metaRemaining = Math.max(0, 5 - ratingAverage);

        charts.rating = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Nota média', 'Meta'],
                datasets: [
                    {
                        data: [ratingAverage, metaRemaining],
                        backgroundColor: ['#f59e0b', '#e5e7eb'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                if (context.dataIndex === 0) {
                                    if (typeof highlights.rating.average !== 'number') {
                                        return 'Sem avaliações registradas';
                                    }

                                    return `Nota média: ${ratingAverage.toFixed(2).replace('.', ',')}`;
                                }

                                return 'Limite superior (5,0)';
                            }
                        }
                    }
                }
            }
        });
    }

    function populateQueues() {
        fillWaitingList();
        fillOngoingTable();
    }

    function fillWaitingList() {
        const list = document.getElementById('waitingList');
        if (!list) {
            return;
        }

        list.innerHTML = '';

        if (!dashboardData.waitingQueue || dashboardData.waitingQueue.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'dashboard-list__item';
            emptyItem.textContent = 'Nenhuma conversa aguardando atendimento.';
            list.appendChild(emptyItem);
            return;
        }

        dashboardData.waitingQueue.forEach(item => {
            const element = document.createElement('li');
            element.className = 'dashboard-list__item';

            const info = document.createElement('div');
            info.className = 'dashboard-list__info';

            const name = document.createElement('strong');
            name.textContent = item.name;

            const meta = document.createElement('span');
            meta.textContent = `${item.channel} · ${item.time}`;

            info.appendChild(name);
            info.appendChild(meta);
            element.appendChild(info);

            if (item.priority) {
                const tag = document.createElement('span');
                tag.className = 'dashboard-list__tag';

                if (item.priority === 'Alta') {
                    tag.classList.add('dashboard-list__tag--high');
                    tag.textContent = 'Prioridade alta';
                } else if (item.priority === 'Média') {
                    tag.classList.add('dashboard-list__tag--medium');
                    tag.textContent = 'Prioridade média';
                } else {
                    tag.classList.add('dashboard-list__tag--low');
                    tag.textContent = 'Prioridade baixa';
                }

                element.appendChild(tag);
            }

            list.appendChild(element);
        });
    }

    function fillOngoingTable() {
        const tbody = document.getElementById('ongoingTable');
        if (!tbody) {
            return;
        }

        tbody.innerHTML = '';

        if (!dashboardData.ongoingConversations || dashboardData.ongoingConversations.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'Nenhuma conversa em atendimento.';
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        dashboardData.ongoingConversations.forEach(conversation => {
            const row = document.createElement('tr');

            const contactCell = document.createElement('td');
            contactCell.textContent = conversation.contact;

            const channelCell = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = ['dashboard-badge', getChannelClass(conversation.channelId)].filter(Boolean).join(' ');
            badge.textContent = conversation.channel;
            channelCell.appendChild(badge);

            const agentCell = document.createElement('td');
            agentCell.textContent = conversation.agent;

            const durationCell = document.createElement('td');
            durationCell.textContent = conversation.duration;

            row.appendChild(contactCell);
            row.appendChild(channelCell);
            row.appendChild(agentCell);
            row.appendChild(durationCell);

            tbody.appendChild(row);
        });
    }

    function setupRefreshButton() {
        const button = document.getElementById('dashboardRefresh');
        if (!button) {
            return;
        }

        button.addEventListener('click', () => loadDashboard());
    }

    function toggleRefreshButton(isLoading) {
        const button = document.getElementById('dashboardRefresh');
        if (!button) {
            return;
        }

        if (isLoading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.textContent;
            }

            button.disabled = true;
            button.classList.add('is-loading');
            button.textContent = 'Atualizando...';
        } else {
            button.disabled = false;
            button.classList.remove('is-loading');
            button.textContent = button.dataset.originalText || 'Atualizar dados';
        }
    }

    function destroyChart(name) {
        if (charts[name]) {
            charts[name].destroy();
            charts[name] = null;
        }
    }

    function setCount(elementId, value) {
        setText(elementId, formatNumber(value || 0));
    }

    function updateChangeIndicator(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }

        element.classList.remove('metric-card__change--up', 'metric-card__change--down');

        if (value === null || value === undefined) {
            element.textContent = '--';
            return;
        }

        if (value >= 0) {
            element.classList.add('metric-card__change--up');
        } else {
            element.classList.add('metric-card__change--down');
        }

        const formatted = `${value >= 0 ? '+' : ''}${formatNumber(Math.abs(value))} vs ontem`;
        element.textContent = formatted;
    }

    function setText(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }

        element.textContent = value;
    }

    function formatNumber(value) {
        const number = Number.isFinite(value) ? value : 0;
        return number.toLocaleString('pt-BR');
    }

    function formatTrend(value) {
        if (value === null || value === undefined) {
            return '--';
        }

        const prefix = value >= 0 ? '+' : '';
        return `${prefix}${value.toFixed(2).replace('.', ',')} p.p. vs ontem`;
    }

    function getChannelClass(channelId) {
        switch (channelId) {
            case 1:
                return 'dashboard-badge--whatsapp';
            case 3:
                return 'dashboard-badge--messenger';
            case 4:
                return 'dashboard-badge--webchat';
            case 5:
                return 'dashboard-badge--instagram';
            default:
                return '';
        }
    }

    function displayErrorState() {
        setText('lastUpdateValue', 'indisponível');
        setText('onlineTeams', '--');
        setText('waitingAverageTime', 'Tempo médio indisponível');
    }
})();
