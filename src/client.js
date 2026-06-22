const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');
const { toSerializedId } = require('./utils/id');
const { handleVote, addManualEntry, removeManualEntry } = require('./pollTracker');

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, '..', 'auth'),
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  logger.info('QR Code gerado. Escaneie com o WhatsApp para autenticar.');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  logger.info('Sessao autenticada com sucesso.');
});

client.on('ready', () => {
  logger.success('WhatsApp conectado.');
});

client.on('auth_failure', (message) => {
  logger.error('Falha na autenticacao do WhatsApp.', message);
});

client.on('disconnected', (reason) => {
  logger.warn(`WhatsApp desconectado: ${reason}`);
});

client.on('vote_update', (vote) => {
  handleVote(client, vote);
});

client.on('message_create', async (message) => {
  const body = message.body.trim().toLowerCase();

  logger.info(`Mensagem recebida: "${message.body}" (de: ${message.from}, minha: ${message.fromMe})`);

  if (body === '!ping') {
    try {
      await message.reply('Pong!');
    } catch (error) {
      logger.error('Erro ao responder o comando !ping.', error);
    }
    return;
  }

  if (body === '!groups') {
    try {
      const chats = await client.getChats();
      const groups = chats.filter((chat) => chat.isGroup);

      if (groups.length === 0) {
        logger.info('Nenhum grupo encontrado nesta conta.');
        return;
      }

      logger.info('Lista de grupos disponiveis:');
      groups.forEach((group) => {
        console.log(`Nome do grupo: ${group.name}`);
        console.log(`ID do grupo: ${group.id._serialized}`);
        console.log('---');
      });
    } catch (error) {
      logger.error('Erro ao listar os grupos.', error);
    }
    return;
  }

  if (body.startsWith('!add ') || body.startsWith('!remove ')) {
    const isAdd = body.startsWith('!add ');
    const rawText = message.body.trim().slice(isAdd ? 5 : 8).trim();
    // id.remote e o JID do chat de forma confiavel, independente de a mensagem
    // ser do proprio bot (fromMe) ou de outra pessoa no grupo.
    const chatId = toSerializedId(message.id.remote);

    if (!rawText) {
      await message.reply(
        isAdd ? 'Use: !add [chave] Nome da pessoa' : 'Use: !remove Nome da pessoa'
      );
      return;
    }

    try {
      if (isAdd) {
        const resolvedName = await addManualEntry(client, chatId, rawText);
        await message.reply(
          resolvedName
            ? `"${resolvedName}" adicionado(a) na lista.`
            : 'Nao ha lista ativa neste grupo para adicionar.'
        );
      } else {
        const removed = await removeManualEntry(client, chatId, rawText);
        await message.reply(
          removed
            ? `"${rawText}" removido(a) da lista.`
            : 'Nao encontrei esse nome na lista (ou nao ha lista ativa).'
        );
      }
    } catch (error) {
      logger.error(`Erro ao processar o comando "${isAdd ? '!add' : '!remove'}".`, error);
    }
  }
});

module.exports = client;
