const userService = require('./userService');

const equipeRepository = require('../../repositories/equipeRepository');
const atendenteRepository = require('../../repositories/atendenteRepository');

exports.getOnline = (teamName) => getOnline(teamName);

module.exports = exports;

async function getOnline(teamName) {
    if (teamName) {
        const users = await userService.getUsers();
        const equipe = await equipeRepository.getByNome(teamName);

        if (equipe.id > 0) {
            const atendentesDaEquipe = await atendenteRepository.getByEquipeId(equipe.id);

            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                if (atendentesDaEquipe.find(a => a.email == user.email)) {
                    return true;
                }
            }
        }
    }

    return false
}