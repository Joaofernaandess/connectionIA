var _intervalTimerRecord = null;
var _gumStream;
var _rec;
var _input;

var AudioContext = window.AudioContext || window.webkitAudioContext;
var _audioContext //audio context to help us record

var _recordButton = document.getElementById("recordButton");
var _recordSendButton = document.getElementById("recordSendButton");
var _recordCancelButton = document.getElementById("recordCancelButton");
var _divRecordTimer = document.getElementById("recordDiv");

function setAudio() {
    _recordButton.addEventListener("click", startRecord);
    _recordSendButton.addEventListener("click", sendRecord);
    _recordCancelButton.addEventListener("click", cancelRecord);

    resetTimerRecord();
}

function startRecord() {
    var constraints = {
        audio: true,
        video: false
    }

    divRecordTimerShow();

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        _audioContext = new AudioContext();
        _gumStream = stream;
        _input = _audioContext.createMediaStreamSource(stream);
        _rec = new Recorder(_input, {
            numChannels: 1
        })
        _rec.record();

    }).catch(function (err) {
        console.log(err);

        divRecordTimerHide();
    });
}

function sendRecord() {
    divRecordTimerHide();
    stopRecord();

    _rec.exportWAV(createDownloadLink);
}

function cancelRecord() {
    divRecordTimerHide();
    stopRecord();
}

function stopRecord() {
    _rec.stop();
    _gumStream.getAudioTracks()[0].stop();

    console.log("Stop record");
}

async function createDownloadLink(blob) {
    const atendimentoId = getAtendimentoId();
    const filename = new Date().getTime();
    // var fd = new FormData();
    // fd.append("audio_data", blob, filename);

    const res = await apiPostEnviarAudio(blob, filename);

    if (res.status == 200) {
        await abreAtendimento({
            id: atendimentoId,
            loading: true,
            aguadar: awaitMessage
        });

        if (hasMessagesUnanswered())
            removeMessagesUnanswered();
    }
}

function divRecordTimerShow() {
    _recordButton.style.display = 'none';
    _divRecordTimer.classList.add("show");

    setTimerRecord();
}

function divRecordTimerHide() {
    _recordButton.style.display = 'block';
    _divRecordTimer.classList.remove("show");

    resetTimerRecord();
}

function setTimerRecord() {
    if (!_intervalTimerRecord) {
        _intervalTimerRecord = setInterval(function () {
            setTimerRecordChange();
        }, 1000);
    }
}

function resetTimerRecord() {
    $("#recordTimerTimer").data("running", false);
    $("#recordTimerTimer").data("hr", 0);
    $("#recordTimerTimer").data("min", 0);
    $("#recordTimerTimer").data("seg", 0);

    $("#recordTimerTimer").text(`00:00:00`);

    if (_intervalTimerRecord) {
        clearInterval(_intervalTimerRecord);
        _intervalTimerRecord = null;
    }
}

function setTimerRecordChange() {
    let hora = isNull($("#recordTimerTimer").data("hora"), 0);
    let min = isNull($("#recordTimerTimer").data("min"), 0);
    let seg = isNull($("#recordTimerTimer").data("seg"), 0);

    seg += 1;
    if (seg >= 60) {
        min += 1;
        seg = 0;
    }
    if (min >= 60) {
        hora += 1;
        min = 0;
    }
    $("#recordTimerTimer").data("running", true);
    $("#recordTimerTimer").data("hr", hora);
    $("#recordTimerTimer").data("min", min);
    $("#recordTimerTimer").data("seg", seg);

    $("#recordTimerTimer").text(`${formatNumber(hora, "00")}:${formatNumber(min, "00")}:${formatNumber(seg, "00")}`);
}