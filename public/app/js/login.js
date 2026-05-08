function loginKeyPress(e) {
    if (e.key == "Enter") {
        const email = $("#email").val();
        const password = $("#password").val();

        if (!email || email.length == 0) {
            alertError("Por favor informe o e-mail.");
        } else if (!password || password.length == 0) {
            alertError("Por favor informe a senha.");
        } else {
            login();
        }
    }
}

async function login() {
    loadingTopOpen();

    try {
        const response = await axios({
            method: 'get',
            url: `/login?email=${$("#email").val()}&password=${$("#password").val()}`,
            timeout: timeOutApiLogin
        });

        goToHome(response.data.data);
    } catch (error) {
        alertError(error);
    } finally {
        loadingTopClose();
    }
}

function logoff() {
    clearTokens();
    clearFilter();
    
    goToLogin();
}

async function validaLogin() {
    const jtoken = getJToken();

    if (!jtoken || jtoken.length == 0) logoff();

    loadingTopOpen();

    try {
        const response = await axios({
            method: 'get',
            url: `/login/valida`,
            timeout: timeOutApi,
            headers: {
                "Authorization": "Bearer " + jtoken
            },
        });
    } catch (error) {
        logoff();
    } finally {
        loadingTopClose();
    }
}

function validaToken() {
    const jtoken = getJToken();

    if (jtoken && jtoken.length > 0) {
        goToHome();
    }
}