const cron = require('node-cron');
const { Poll } = require('whatsapp-web.js');
const logger = require('./utils/logger');
const config = require('./config');
const { createPollRoster } = require('./pollTracker');
const { getMode } = require('./modes');

async function sendToGroup(client, job) {
  try {
    const chat = await client.getChatById(job.groupId);

    if (!chat || !chat.isGroup) {
      logger.error(`Grupo com ID "${job.groupId}" nao foi encontrado.`);
      return;
    }

    const mode = getMode(job.mode);
    const poll = new Poll('Quer?', mode.options);
    const pollMessage = await chat.sendMessage(poll);
    logger.success(`Enquete enviada com sucesso para "${chat.name}".`);

    await createPollRoster(client, pollMessage.id._serialized, chat.id._serialized, job.mode, {
      gameWeekday: job.gameWeekday,
      gameTime: job.gameTime,
      price: job.price,
      pixKey: job.pixKey,
      pixName: job.pixName,
    });
  } catch (error) {
    logger.error(`Erro ao enviar enquete para o grupo "${job.groupId}".`, error);
  }
}

async function sendScheduledMessages(client) {
  if (config.jobs.length === 0) {
    logger.error('Nenhum grupo configurado no .env. Mensagem nao enviada.');
    return;
  }

  for (const job of config.jobs) {
    await sendToGroup(client, job);
  }
}

function startScheduler(client) {
  if (!cron.validate(config.schedule)) {
    logger.error(`Expressao cron invalida: "${config.schedule}". Agendamento nao iniciado.`);
    return;
  }

  cron.schedule(
    config.schedule,
    () => {
      sendScheduledMessages(client);
    },
    {
      timezone: config.timezone,
    }
  );

  logger.success('Agendamento iniciado.');
}

module.exports = startScheduler;
