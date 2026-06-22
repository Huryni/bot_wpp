const cron = require('node-cron');
const logger = require('./utils/logger');
const config = require('./config');

async function sendToGroup(client, job) {
  try {
    const chat = await client.getChatById(job.groupId);

    if (!chat || !chat.isGroup) {
      logger.error(`Grupo com ID "${job.groupId}" nao foi encontrado.`);
      return;
    }

    await chat.sendMessage(job.message);
    logger.success(`Mensagem enviada com sucesso para "${chat.name}".`);
  } catch (error) {
    logger.error(`Erro ao enviar mensagem para o grupo "${job.groupId}".`, error);
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
