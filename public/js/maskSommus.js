// dependence vanilla-masker

function inputHandler(masks, max, event) {
    var c = event.target;    
    var v = c.value.replace(/\D/g, '');
    var m = c.value.length > max ? 1 : 0;

    VMasker(c).unMask();
    VMasker(c).maskPattern(masks[m]);

    c.value = VMasker.toPattern(v, masks[m]);
}

function setMaskSommus(selector, masks) {
    var inputs = document.querySelectorAll(selector);
    
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        if (masks[0].replace(/\D/g, '').length == input.value.replace(/\D/g, '').length) {
            VMasker(input).maskPattern(masks[0]);
        } else {
            VMasker(input).maskPattern(masks[1]);
        }

        input.addEventListener('input',
            inputHandler.bind(undefined, masks, 14), false);
    }
}