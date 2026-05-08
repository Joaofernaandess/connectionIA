const delayDefault = 300;

function confirmSommus(params) {
    //if (!params.confirm) { params.confirm = { text: "Sim", function: null }; }
    //if (!params.cancel) { params.cancel = { text: "Não", function: "confirmSommusClose();" }; }

    /// Quanto um confirm-sommus era aberto pós fechamento de outro confirm-sommus, o segundo confirm-sommus era fechado
    /// Por isso esse delay de 500 milissegundos
    const sleepTime = 300;
    var element = isNull(params.element, 'body');
    var focus = $(':focus');

    $(element).append(confirmSommusGetHtml(params));

    $('.confirm-sommus').find('.message .icon').append(confirmSommusGetIcon(params.type)).css('color', confirmSommusGetColor(params.type));
    $('.confirm-sommus').find('.message .icon i').css('color', confirmSommusGetColor(params.type));

    if (isNull(params.title, '').length > 0) {
        $('.confirm-sommus').find('.message .title').css('color', confirmSommusGetColor(params.type)).html(params.title);
    }
    $('.confirm-sommus').find('.message .description').html(params.description);

    if (params.confirm && isNull(params.confirm.text, '').length > 0) {
        $('.confirm-sommus').find('.message .confirm').off('click')
            .html(isNull(params.confirm.text, 'Sim'))
            .on('click', async function () {
                if (isNull(params.confirm.function, '').length > 0) {
                    if (!params.confirm.mantemConfirmAberto) {
                        confirmSommusClose();
                        await sleep(sleepTime);
                    }
                    eval(params.confirm.function);
                }
            });
    } else {
        $('.confirm-sommus').find('.message .confirm').css('display', 'none');
    }

    if (params.alternative && isNull(params.alternative.text, '').length > 0) {
        //$('.confirm-sommus').find('.message').css('width', '470px');
        $('.confirm-sommus').find('.message').css('width', '800px');

        $('.confirm-sommus').find('.message .alternative').off('click')
            .html(isNull(params.alternative.text, 'Opção alternativa'))
            .on('click', async function () {
                if (isNull(params.alternative.function, '').length > 0) {
                    if (!params.alternative.mantemConfirmAberto) {
                        confirmSommusClose();
                        await sleep(sleepTime);
                    }
                    eval(params.alternative.function);
                }
            });
    }

    if (params.cancel && isNull(params.cancel.text, '').length > 0) {
        $('.confirm-sommus').find('.message .cancel').off('click')
            .html(isNull(params.cancel.text, 'Não'))
            .on('click', async function () {
                if (isNull(params.cancel.function, '').length > 0) {
                    confirmSommusClose();
                    await sleep(sleepTime);
                    eval(params.cancel.function);
                } else {
                    confirmSommusClose();
                }
            }).focus();
    }

    $('.confirm-sommus')
        .css("display", "flex");

    $('.confirm-sommus .message').fadeToggle(isNull(params.delayDefault, 0) ? params.delayDefault : delayDefault).addClass('confirm-sommus-slide-in-down');
    $('.confirm-sommus .dimmed').fadeToggle(isNull(params.delayDefault, 0) ? params.delayDefault : delayDefault);

    $('.confirm-sommus').data('delay', isNull(params.delayDefault, 0) ? params.delayDefault : delayDefault);
    $('.confirm-sommus').data('focus', focus);
    $('.confirm-sommus').focus();

    if (params.cancel && isNull(params.cancel.text, '').length > 0) {
        $('.confirm-sommus').find('.message .cancel').focus();
    } else {
        $('.confirm-sommus').find('.message .confirm').focus();
    }

    confirmSommusActiveEscKey();
}

function confirmSommusClose() {
    const main = $('#main');
    const scrollTop = main.scrollTop();

    confirmSommusDesactiveEscKey();

    if ($('.card-list .card-body table').length > 0) {
        $('.card-list .card-body table').focus();
    } else {
        var focus = $('.confirm-sommus').data('focus');
        if (focus) {
            $(focus[focus.length - 1]).focus();
        }
    }

    var delay = $('.confirm-sommus').data('delay');
    $('.confirm-sommus .message').addClass('confirm-sommus-slide-out-up').fadeToggle(
        delay, () => $('.confirm-sommus .dimmed').toggle(0, () => $('.confirm-sommus').remove()));

    main.scrollTop(scrollTop);
    //$('.confirm-sommus .dimmed').fadeToggle(0, () => $('.confirm-sommus').remove());
    //$('.confirm-sommus .dimmed').toggle(isNull(params.delayDefault, 0) ? params.delayDefault : delayDefault, () => $('.confirm-sommus').remove());
}

function confirmSommusActiveEscKey() {
    confirmSommusDesactiveEscKey();
    $('body').on('keydown', function (e) {
        confirmSommusEscKey(e);
    })
}

function confirmSommusDesactiveEscKey() {
    $('body').off('keydown');
}

function confirmSommusEscKey(e) {
    if (e.keyCode == _key().ESC) {
        confirmSommusClose();
    }
}

function confirmSommusGetHtml(params) {

    var html = '';
    var functionClose = isNull(params.blockClose, false) ? '' : 'onclick="confirmSommusClose();"';

    $('body').find('.confirm-sommus').remove('.confirm-sommus');

    html += '<div class="confirm-sommus" tabindex="0">';
    html += '<div class="dimmed" ' + functionClose + '></div>';
    html += '<div class="message">';
    html += '<p class="icon"></p>';
    html += '<p class="title"></p>';
    html += '<p class="description"></p>';

    if (params.alternative && isNull(params.alternative.text, '').length > 0) {
        html += '<div class="buttons">';
        if (params.cancel && isNull(params.cancel.text, '').length > 0) {
            html += '<button class="btn btn-danger cancel"></button>';
            //html += '<div class="col"></div>';
        }
        html += '<button class="btn btn-primary confirm"></button>';
        //html += '</div>';

        //html += '<div class="buttons" style="margin-top: 20px;">';
        //html += '<div class="col"></div>';
        html += '<button class="btn btn-success alternative"></button>';
        html += '</div>';
    }
    else {
        html += '<div class="buttons">';
        if (params.cancel && isNull(params.cancel.text, '').length > 0) {
            html += '<button class="btn btn-danger cancel"></button>';
        }
        html += '<button class="btn btn-primary confirm"></button>';
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    return html;
}

function confirmSommusGetColor(type) {
    if (type.toLowerCase() == "error") {
        return confirmSommusType().error.color;
    } else if (type.toLowerCase() == "warning") {
        return confirmSommusType().warning.color;
    } else {
        return confirmSommusType().info.color;
    }
}

function confirmSommusGetIcon(type) {
    if (type.toLowerCase() == "error") {
        return confirmSommusType().error.icon;
    } else if (type.toLowerCase() == "warning") {
        return confirmSommusType().warning.icon;
    } else {
        return confirmSommusType().info.icon;
    }
}

function confirmSommusType() {
    return {
        'error': {
            'icon': '<i class="icon sb-erro"></i>',
            'color': '#FF5C64'
        },
        'warning': {
            'icon': '<i class="icon sb-importante"></i>',
            'color': '#FFAE57'
        },
        'info': {
            'icon': '<i class="icon sb-concluido"></i>',
            'color': '#5797FF'
        }
    }
}

function _key() {
    return ({
        "BACKSPACE": 8,
        "TAB": 9,
        "ENTER": 13,
        "SHIFT": 16,
        "CONTROL": 17,
        "ESC": 27,
        "PAGE_UP": 33,
        "PAGE_DOWN": 34,
        "END": 35,
        "HOME": 36,
        "UP_ARROW": 38,
        "DOWN_ARROW": 40,
        "INSERT": 45,
        "DELETE": 46,
        "F2": 113
    });
}