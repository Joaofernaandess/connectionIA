exports.login = (req, res) => login(req, res);
exports.home = (req, res) => home(req, res);
exports.dashboard = (req, res) => dashboard(req, res);

module.exports = exports;

function login(req, res) {
    // syncService.processar();

    res.render('home/login');
}

function home(req, res) {
    res.render('home/home');
}

function dashboard(req, res) {
    res.render('home/dashboard');
}