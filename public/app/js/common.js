const awaitMessage = 500;
const awaitList = 700;
const timeOutApi = 60000;
const timeOutApiLogin = 240000;
const THEME_STORAGE_KEY = 'sommus_theme_preference';

let systemThemeQuery = null;
let systemThemeQueryHandler = null;

function commonOnLoad() {
    initializeTheme();
    createSnackBar();
    // setMask();
}

function initializeTheme() {
    const preference = getStoredThemePreference();
    applyThemePreference(preference);
}

function getStoredThemePreference() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch (error) {
        console.warn('Não foi possível carregar a preferência de tema.', error);
    }

    return 'system';
}

function applyThemePreference(preference) {
    const resolvedTheme = resolveTheme(preference);
    setThemeAttributes(resolvedTheme, preference);
    bindSystemThemeListener(preference);
    updateThemeControls(preference);
}

function resolveTheme(preference) {
    if (preference === 'dark' || preference === 'light') {
        return preference;
    }

    if (window.matchMedia) {
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        return query.matches ? 'dark' : 'light';
    }

    return 'light';
}

function setThemeAttributes(theme, preference) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-preference', preference);

    if (document.body) {
        document.body.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme-preference', preference);
    }
}

function bindSystemThemeListener(preference) {
    if (systemThemeQuery && systemThemeQueryHandler) {
        if (systemThemeQuery.removeEventListener) {
            systemThemeQuery.removeEventListener('change', systemThemeQueryHandler);
        } else if (systemThemeQuery.removeListener) {
            systemThemeQuery.removeListener(systemThemeQueryHandler);
        }

        systemThemeQuery = null;
        systemThemeQueryHandler = null;
    }

    if (preference !== 'system' || !window.matchMedia) {
        return;
    }

    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeQueryHandler = (event) => {
        const theme = event.matches ? 'dark' : 'light';
        setThemeAttributes(theme, preference);
        updateThemeControls(preference);
    };

    if (systemThemeQuery.addEventListener) {
        systemThemeQuery.addEventListener('change', systemThemeQueryHandler);
    } else if (systemThemeQuery.addListener) {
        systemThemeQuery.addListener(systemThemeQueryHandler);
    }
}

function updateThemeControls(preference) {
    const labels = {
        light: 'Tema claro',
        dark: 'Tema escuro',
        system: 'Tema do sistema'
    };

    const icons = {
        light: '☀️',
        dark: '🌙',
        system: '🖥️'
    };

    const labelElement = document.getElementById('themePreferenceLabel');
    const iconElement = document.getElementById('themePreferenceIcon');
    const buttonElement = document.getElementById('themePreferenceButton');
    const labelText = labels[preference] || labels.system;
    const iconText = icons[preference] || icons.system;

    if (labelElement) {
        labelElement.textContent = labelText;
    }

    if (iconElement) {
        iconElement.textContent = iconText;
    }

    if (buttonElement) {
        buttonElement.setAttribute('aria-label', labelText);
        buttonElement.setAttribute('data-selected-theme', preference);
    }

    document.querySelectorAll('[data-theme-option]').forEach(option => {
        const optionValue = option.getAttribute('data-theme-option');
        option.classList.toggle('active', optionValue === preference);
    });
}

function setThemePreference(preference) {
    const allowedPreferences = ['light', 'dark', 'system'];
    const value = allowedPreferences.includes(preference) ? preference : 'system';

    try {
        localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch (error) {
        console.warn('Não foi possível salvar a preferência de tema.', error);
    }

    applyThemePreference(value);
}

if (typeof window !== 'undefined') {
    window.setThemePreference = setThemePreference;
}

function setMask() {
    setMaskSommus('.telefone', ['(99) 9999-9999', '(99) 99999-9999'])
    setMaskSommus('.whatsapp', ['(99) 9999-9999', '(99) 99999-9999'])

    // setMaskTelefoneWhatsApp();
}

function setMaskTelefoneWhatsApp() {
    let telefones = $('.telefone');    
    for (let i = 0; i < telefones.length; i++) {
        const telefoneInput = telefones[i];
        const telefoneSemMascara = removeMask($(telefoneInput).val());

        if (telefoneSemMascara.length > 10) {
            $(telefoneInput).mask("(99) 99999-9999");
        } else {
            $(telefoneInput).mask("(99) 9999-9999");
        }
    }

    let whatsApps = $('.whatsapp');
    for (let i = 0; i < whatsApps.length; i++) {
        const whatsAppInput = whatsApps[i];
        const whatsAppSemMascara = removeMask($(whatsAppInput).val());

        if (whatsAppSemMascara.length > 10) {
            $(whatsAppInput).mask("(99) 99999-9999");
        } else {
            $(whatsAppInput).mask("(99) 9999-9999");
        }
    }
}

function getAlert(type, content, timeout = 0) {
    snackBar(content, type, {
        timeout: timeout
    });
}

function alertError(error) {
    try {
        if (typeof error == "string") {
            getAlertError(error);
        } else {
            if (error.response && typeof error.response != "string") {
                getAlertError(error.response.data.mensagem);
            } else if (error.request && typeof error.request == "string") {
                getAlertError(error.request);
            } else if (error.message && typeof error.message == "string") {
                getAlertError(error.message);
            } else {
                getAlertError("Erro desconhecido");
            }
        }
    } catch {
        getAlertError("Erro interno");
    }
}

function getAlertError(message) {
    confirmSommus({
        title: 'Erro',
        description: message,
        type: "error",
        cancel: {
            text: 'Ok'
        }
    });
}

function goToLogin() {
    window.location = "/";
}

function goToHome(data) {
    if (data) {
        setTokens(data);
    }

    window.location = "/home";
}

function setTokens(data) {
    sessionStorage.setItem("jtoken", data.token);
    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
    sessionStorage.setItem("atendente", JSON.stringify(data.atendente));
    setAuthCookie(data.token);
}

function setLastUpdate() {
    sessionStorage.setItem("lastUpdate", moment());
}

function clearTokens() {
    sessionStorage.removeItem("jtoken");
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("atendente");
    clearAuthCookie();
}

function getJToken() {
    return sessionStorage.getItem("jtoken");
}

function getUsuario() {
    return JSON.parse(sessionStorage.getItem("usuario"));
}

function getAtendenteStorage() {
    return JSON.parse(sessionStorage.getItem("atendente"));
}

function getLastUpdate() {
    sessionStorage.getItem("lastUpdate");
}

function setSelect(id, data) {
    if (!data) return;

    $(id).empty();

    data.forEach(option => {
        let stringEntitie = "";

        if (option.entitie && (
                id == "#selectAtendentes" ||
                id == "#selectTransferenciaAtendentes")) {
            stringEntitie = `
                data-email='${option.entitie.email}'
                data-equipes='${JSON.stringify(option.entitie.equipes)}'
                data-equipe-principal='${option.entitie.equipePrincipalId}'
                data-departamentos='${JSON.stringify(option.entitie.departamentos)}'
                data-departamento-principal='${option.entitie.departamentoPrincipalId}'
            `;
        } else if (option.entitie && (
                id == "#selectEquipes" ||
                id == "#selectTransferenciaEquipes")) {
            stringEntitie = `
                data-departamento-id='${option.entitie.departamentoId}'
            `;
        }
        
        // Suporte para campo tipo em modelos
        if (option.tipo !== undefined) {
            stringEntitie += `data-tipo='${option.tipo}' `;
        }

        stringEntitie += `data-count=${data.length}`

        $(id).append(`
            <option id="${option.id}" ${stringEntitie}>
                ${option.description}
            </option>
        `);
    });
}

function getIdSelect(element) {
    return $(element).children(":selected").attr("id");
}

function setIdSelect(element, id) {
    if (id > 0) {
        $(element).find(`#${id}`).attr('selected', 'selected');
    }
}

function getDataSelect(element, data) {
    return $(element).children(":selected").data(data);
}

function isNull(value, _default) {
    return value || _default;
}

function formatNumber(myNumber, format) {
    return (format + myNumber).slice(format.length * (-1));
}

function getUrlParameter(sParam) {
    let sPageURL = window.location.search.substring(1);
    let sURLVariables = sPageURL.split('&');
    let sParameterName;
    let i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
}

function clearUrlParameters(path = "/login") {
    window.history.replaceState({}, document.title, path);
}

function setAuthCookie(token) {
    if (!token) {
        return;
    }

    const value = encodeURIComponent(`Bearer ${token}`);
    document.cookie = `authToken=${value}; path=/; SameSite=Lax`;
}

function clearAuthCookie() {
    document.cookie = 'authToken=; Max-Age=0; path=/; SameSite=Lax';
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function round(number = 0, decimals) {
    if ((typeof number !== 'number') || (typeof decimals !== 'number'))
        return false

    var num_sign = number >= 0 ? 1 : -1;

    return parseFloat((Math.round((number * Math.pow(10, decimals)) + (num_sign * 0.0001)) / Math.pow(10, decimals)).toFixed(decimals));
}

function activeAudioStart() {
    $(function () {
        $("audio").off("play").on("play", function () {
            $("audio").not(this).each(function (index, audio) {
                audio.pause();
            });
        });
    });
}

function removeMask(string) {
    return string.replace(/[^0-9]+/g, '');
}