const logger = require('./utils/logger');
const config = require('./config');
const { toSerializedId } = require('./utils/id');
const { getMode } = require('./modes');

// pollId -> { chatId, mode, roster, listMessage, timer }
const polls = new Map();

// chatId -> pollId da enquete/lista mais recente criada para esse grupo,
// usado pelos comandos manuais !add e !remove.
const latestPollByChat = new Map();

async function resolveVoterName(client, voterId) {
  try {
    const contact = await client.getContactById(voterId);
    return contact.pushname || contact.name || contact.number || voterId;
  } catch (error) {
    logger.warn(`Nao foi possivel resolver o contato "${voterId}", usando o ID bruto.`);
    return voterId;
  }
}

async function flush(client, pollId) {
  const state = polls.get(pollId);
  if (!state) return;

  state.timer = null;
  const text = state.mode.render(state.roster);

  try {
    // WhatsApp so permite editar mensagens por um tempo limitado apos o envio.
    // Quando a edicao deixa de ser possivel, enviamos uma nova mensagem e
    // continuamos editando a partir dela.
    const edited = state.listMessage ? await state.listMessage.edit(text) : null;

    if (edited) {
      state.listMessage = edited;
      logger.success('Lista atualizada com sucesso.');
    } else {
      state.listMessage = await client.sendMessage(state.chatId, text);
      logger.success('Lista enviada com sucesso.');
    }
  } catch (error) {
    logger.error('Erro ao atualizar a lista.', error);
  }
}

async function createPollRoster(client, pollId, chatId, modeName, params) {
  const mode = getMode(modeName);

  polls.set(pollId, {
    chatId,
    mode,
    roster: mode.createState(params),
    listMessage: null,
    timer: null,
  });

  latestPollByChat.set(chatId, pollId);

  await flush(client, pollId);
}

async function handleVote(client, vote) {
  try {
    const parentMessageId = vote.parentMessage && vote.parentMessage.id;
    const pollId = toSerializedId(parentMessageId);
    const voterId = toSerializedId(vote.voter);
    const selectedNames = (vote.selectedOptions || []).map((option) => option.name);

    logger.info(
      `Voto recebido: voter="${voterId}" pollId="${pollId}" selecionado=[${selectedNames.join(', ')}]`
    );

    if (!pollId || !voterId) {
      logger.warn('Voto ignorado: nao foi possivel identificar pollId ou voterId.');
      return;
    }

    const state = polls.get(pollId);
    if (!state) {
      logger.warn(`Voto ignorado: enquete "${pollId}" nao esta sendo rastreada.`);
      return;
    }

    state.mode.removeVoter(state.roster, voterId);

    const desiredOption = selectedNames.find((name) => state.mode.options.includes(name));

    if (desiredOption) {
      const name = await resolveVoterName(client, voterId);
      state.mode.placeVoter(state.roster, voterId, name, desiredOption);
    }

    if (state.timer) {
      clearTimeout(state.timer);
    }

    state.timer = setTimeout(() => flush(client, pollId), config.pollDebounceMs);
  } catch (error) {
    logger.error('Erro ao processar voto da enquete.', error);
  }
}

// Permite "!add lev Nome" / "!add d1 Nome" para escolher a secao manualmente.
// Se a primeira palavra nao for uma chave conhecida do modo, o texto inteiro e o nome.
function extractKeyword(rawText, mode) {
  const trimmed = rawText.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { keyword: null, name: trimmed };

  const firstWord = trimmed.slice(0, spaceIndex).toLowerCase();
  if (mode.manualKeywords && firstWord in mode.manualKeywords) {
    return { keyword: firstWord, name: trimmed.slice(spaceIndex + 1).trim() };
  }

  return { keyword: null, name: trimmed };
}

async function addManualEntry(client, chatId, rawText) {
  const pollId = latestPollByChat.get(chatId);
  const state = pollId && polls.get(pollId);
  if (!state) return null;

  const { keyword, name } = extractKeyword(rawText, state.mode);
  if (!name) return null;

  state.mode.addManual(state.roster, name, keyword);

  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }

  await flush(client, pollId);
  return name;
}

async function removeManualEntry(client, chatId, name) {
  const pollId = latestPollByChat.get(chatId);
  const state = pollId && polls.get(pollId);
  if (!state) return false;

  const removed = state.mode.removeManual(state.roster, name);
  if (!removed) return false;

  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }

  await flush(client, pollId);
  return true;
}

module.exports = { createPollRoster, handleVote, addManualEntry, removeManualEntry };
