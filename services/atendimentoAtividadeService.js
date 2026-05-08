const responseTypeEnum = require('../enums/responseTypeEnum');

const atendimentoAtividadeRepository = require('../repositories/atendimentoAtividadeRepository');

exports.add = (atendimentoAtividade) => add(atendimentoAtividade);

async function add(atendimentoAtividade) {
    const response = await atendimentoAtividadeRepository.add(atendimentoAtividade);

    if (response.type === responseTypeEnum.success) {
        atendimentoAtividade.id = response.content.insertId;
    }

    return atendimentoAtividade;
}