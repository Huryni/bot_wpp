const client = require('./client');
const startScheduler = require('./scheduler');
const logger = require('./utils/logger');

logger.info('Bot iniciado.');

client.on('ready', () => {
  startScheduler(client);
});

client.initialize().catch((error) => {
  logger.error('Erro ao inicializar o cliente do WhatsApp.', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promise rejeitada sem tratamento.', reason);
});

process.on('SIGINT', async () => {
  logger.info('Encerrando o bot...');
  try {
    await client.destroy();
  } catch (error) {
    logger.error('Erro ao encerrar o cliente do WhatsApp.', error);
  } finally {
    process.exit(0);
  }
});
