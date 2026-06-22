const logger = require('../utils/logger');
const { formatHeaderDate } = require('../utils/weekday');

const DUPLA_SLOTS = 5;
const OPTION_PREFIX = 'Dupla ';
const OPTION_ESPERA = 'Lista de espera';

const options = Array.from({ length: DUPLA_SLOTS }, (_, i) => `${OPTION_PREFIX}${i + 1}`).concat(OPTION_ESPERA);

// Palavras-chave aceitas em "!add <chave> Nome" para escolher a dupla manualmente.
const manualKeywords = { espera: OPTION_ESPERA };
for (let i = 1; i <= DUPLA_SLOTS; i += 1) {
  manualKeywords[`d${i}`] = `${OPTION_PREFIX}${i}`;
  manualKeywords[`dupla${i}`] = `${OPTION_PREFIX}${i}`;
}

function createState({ gameWeekday, gameTime, price, pixKey, pixName }) {
  return {
    gameWeekday,
    gameTime,
    price,
    pixKey,
    pixName,
    duplas: Array.from({ length: DUPLA_SLOTS }, () => []),
    espera: [],
    voterPositions: new Map(),
  };
}

function removeVoter(state, voterId) {
  const position = state.voterPositions.get(voterId);
  if (!position) return;

  if (position.section === 'dupla') {
    state.duplas[position.index] = state.duplas[position.index].filter((entry) => entry.voterId !== voterId);
  } else {
    state.espera = state.espera.filter((entry) => entry.voterId !== voterId);
  }

  state.voterPositions.delete(voterId);
}

function parseDuplaIndex(option) {
  if (!option.startsWith(OPTION_PREFIX)) return null;
  const number = Number(option.slice(OPTION_PREFIX.length));
  return Number.isInteger(number) && number >= 1 && number <= DUPLA_SLOTS ? number - 1 : null;
}

function placeVoter(state, voterId, name, desiredOption) {
  if (desiredOption === OPTION_ESPERA) {
    state.espera.push({ voterId, name });
    state.voterPositions.set(voterId, { section: 'espera' });
    return;
  }

  const index = parseDuplaIndex(desiredOption);
  if (index === null) return;

  if (state.duplas[index].length >= 2) {
    logger.warn(`Voto ignorado: a Dupla ${index + 1} ja esta completa (voter="${voterId}").`);
    return;
  }

  state.duplas[index].push({ voterId, name });
  state.voterPositions.set(voterId, { section: 'dupla', index });
}

function findVoterIdByName(state, name) {
  const target = name.trim().toLowerCase();

  for (const [voterId, position] of state.voterPositions) {
    let entryName = null;

    if (position.section === 'dupla') {
      const entry = state.duplas[position.index].find((e) => e.voterId === voterId);
      entryName = entry && entry.name;
    } else {
      const entry = state.espera.find((e) => e.voterId === voterId);
      entryName = entry && entry.name;
    }

    if (entryName && entryName.trim().toLowerCase() === target) {
      return voterId;
    }
  }

  return null;
}

function findNextAvailableDuplaOption(state) {
  const index = state.duplas.findIndex((people) => people.length < 2);
  return index === -1 ? OPTION_ESPERA : `${OPTION_PREFIX}${index + 1}`;
}

function addManual(state, name, keyword) {
  const voterId = `manual:${name.trim().toLowerCase()}`;
  removeVoter(state, voterId);
  const explicitOption = keyword && manualKeywords[keyword.toLowerCase()];
  const desiredOption = explicitOption || findNextAvailableDuplaOption(state);
  placeVoter(state, voterId, name.trim(), desiredOption);
}

function removeManual(state, name) {
  const voterId = findVoterIdByName(state, name);
  if (!voterId) return false;
  removeVoter(state, voterId);
  return true;
}

function renderDuplas(duplas) {
  return duplas
    .map((people, index) => `${String(index + 1).padStart(2, '0')} - ${people.map((p) => p.name).join(' e ')}`)
    .join('\n');
}

function renderWaitingList(espera) {
  const lines = [];

  for (let i = 0; i < espera.length; i += 2) {
    const pair = espera.slice(i, i + 2);
    lines.push(`- ${pair.map((entry) => entry.name).join(' e ')}`);
  }

  return lines.join('\n');
}

function render(state) {
  const lines = [
    '📌 ARENA CRONOS – AREIA',
    '🏐 DUPLA MISTA',
    `🗓️ ${formatHeaderDate(state.gameWeekday)}`,
    `🕗 ${state.gameTime || 'Horario a definir'}`,
    '',
    '> ganhou duas sai uma e volta na próxima',
    '> desafiado marca placar',
    '',
    renderDuplas(state.duplas),
    '',
    '> LISTA DE ESPERA',
    renderWaitingList(state.espera),
    '',
    `Valor: ${state.price}`,
    `Pix: ${state.pixKey}`,
    state.pixName,
  ];

  return lines.join('\n');
}

module.exports = { options, manualKeywords, createState, removeVoter, placeVoter, addManual, removeManual, render };
