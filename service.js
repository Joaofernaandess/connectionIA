var Service = require('node-windows').Service;
// Criando um novo objeto do Serviço
var svc = new Service({
    //Nome do servico
    name: 'SommusBlip',
    //Descricao que vai aparecer no Gerenciamento de serviço do Windows
    description: 'Aplicação da Sommus Sistemas integrada ao BLiP da Take que lista os atendimentos com opção de filtro e transferência.',
    //caminho absoluto do seu script
    script: 'C:\\SommusBLiP\\index.js'
});

svc.on('install', function () {
    svc.start();
});

// instalando o servico
svc.install();