const result = require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    transports: ["polling"],
    upgradeTimeout: 60000,
    destroyUpgradeTimeout: 60000
});

const port = 8090;

http.listen(port, () => console.log(`[${port}] SommusBLiP-web`));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Max-Age', '1000');

    req.io = io;

    next();
});

app.use('/', require('./routes/index'));
app.use('/dashboard', require('./routes/dashboard'));

app.use('/login', require('./routes/login'));
app.use('/atendimentos', require('./routes/atendimento'));
app.use('/atendentes', require('./routes/atendente'));
app.use('/equipes', require('./routes/equipe'));
app.use('/departamentos', require('./routes/departamento'));
app.use('/canais', require('./routes/canal'));
app.use('/contatos', require('./routes/contato'));
app.use('/notificacaoAtiva', require('./routes/notificacaoAtiva'));
app.use('/redirecionamento', require('./routes/redirecionamento'));
app.use('/notificacaoAtiva', require('./routes/notificacaoAtiva'));

// EXTERNAL ACCESS
app.use('/sync', require('./routes/external_access/sync'));
app.use('/users', require('./routes/external_access/users'));
app.use('/teams', require('./routes/external_access/teams'));
app.use('/webhook', require('./routes/external_access/webhook'));
app.use('/attendance', require('./routes/external_access/attendance'));
app.use('/redirect', require('./routes/external_access/redirect'));
app.use('/holiday', require('./routes/external_access/holiday'));
app.use('/health', require('./routes/external_access/health'));
app.use('/notificacaoMassa', require('./routes/external_access/notificacaoMassa'));

// SOCKET IO
io.on('connection', (socket) => { 
    const userService = require('./services/external_access/userService');
    const logService = require('./services/common/logService');
    const usuario = socket.handshake.query.usuario;

    socket.on('disconnect', function () {
        logService.log(`USERSERVICE - Usuário ${socket.id} - ${usuario} disconectado.`);

        userService.removeUser(socket);
    });

    userService.setUser(socket);

    logService.log(`USERSERVICE - Usuário ${socket.id} - ${usuario} conectado.`);
});