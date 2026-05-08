function snackBar(text, type, config) {
    if (!text)
        return

    if (!config)
        config = getConfigDefault();

    const x = $("#snackbar");

    if (config.style) {
        x.css(config.style);
    } else {
        x.css({});
    }

    x.html(text);
    x.removeClass("hidden").addClass(type).addClass("show");

    if (config.timeout > 0)
        setTimeout(function () {
            x.removeClass("show");
        }, config.timeout);
}

function getConfigDefault() {
    return {
        "timeout": 0
    }
}

function createSnackBar() {
    $("body").append(`
        <div id="snackbar" onclick="closeSnackBar()"></div>
    `);
}

function closeSnackBar() {
    const x = $("#snackbar");

    x.addClass("hidden");
    setTimeout(function () {
        x.removeClass("show");
    }, 400);
}