const { formatHeaderDate } = require('../utils/weekday');

const LEVANTADOR_SLOTS = 4;
const PRESENCA_SLOTS = 20;

const OPTION_LEVANTADOR = 'Levantador';
const OPTION_PRESENCA = 'Lista de presença';
const OPTION_ESPERA = 'Lista de espera';

const options = [OPTION_LEVANTADOR, OPTION_PRESENCA, OPTION_ESPERA];

// Palavras-chave aceitas em "!add <chave> Nome" para escolher a seção manualmente.
const manualKeywords = {
  lev: OPTION_LEVANTADOR,
  levantador: OPTION_LEVANTADOR,
  presenca: OPTION_PRESENCA,
  'presença': OPTION_PRESENCA,
  espera: OPTION_ESPERA,
};

function createState({ gameWeekday, gameTime, price, pixKey, pixName }) {
  return {
    gameWeekday,
    gameTime,
    price,
    pixKey,
    pixName,
    levantadores: new Array(LEVANTADOR_SLOTS).fill(null),
    presenca: new Array(PRESENCA_SLOTS).fill(null),
    espera: [],
    voterPositions: new Map(),
  };
}

function removeVoter(state, voterId) {
  const position = state.voterPositions.get(voterId);
  if (!position) return;

  if (position.section === 'levantadores') {
    state.levantadores[position.index] = null;
  } else if (position.section === 'presenca') {
    state.presenca[position.index] = null;
  } else {
    state.espera = state.espera.filter((entry) => entry.voterId !== voterId);
  }

  state.voterPositions.delete(voterId);
}

function placeVoter(state, voterId, name, desiredOption) {
  if (desiredOption === OPTION_LEVANTADOR) {
    const freeIndex = state.levantadores.findIndex((slot) => slot === null);
    if (freeIndex !== -1) {
      state.levantadores[freeIndex] = { voterId, name };
      state.voterPositions.set(voterId, { section: 'levantadores', index: freeIndex });
      return;
    }
  } else if (desiredOption === OPTION_PRESENCA) {
    const freeIndex = state.presenca.findIndex((slot) => slot === null);
    if (freeIndex !== -1) {
      state.presenca[freeIndex] = { voterId, name };
      state.voterPositions.set(voterId, { section: 'presenca', index: freeIndex });
      return;
    }
  }

  // Lista de espera direta, ou overflow de Levantador/Presenca quando as vagas acabam.
  state.espera.push({ voterId, name });
  state.voterPositions.set(voterId, { section: 'espera' });
}

function findVoterIdByName(state, name) {
  const target = name.trim().toLowerCase();

  for (const [voterId, position] of state.voterPositions) {
    let entryName = null;

    if (position.section === 'levantadores') {
      entryName = state.levantadores[position.index] && state.levantadores[position.index].name;
    } else if (position.section === 'presenca') {
      entryName = state.presenca[position.index] && state.presenca[position.index].name;
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

function addManual(state, name, keyword) {
  const voterId = `manual:${name.trim().toLowerCase()}`;
  removeVoter(state, voterId);
  const desiredOption = (keyword && manualKeywords[keyword.toLowerCase()]) || OPTION_PRESENCA;
  placeVoter(state, voterId, name.trim(), desiredOption);
}

function removeManual(state, name) {
  const voterId = findVoterIdByName(state, name);
  if (!voterId) return false;
  removeVoter(state, voterId);
  return true;
}

function renderSlots(slots, startNumber) {
  return slots
    .map((entry, index) => {
      const number = String(startNumber + index).padStart(2, '0');
      return `${number} - ${entry ? entry.name : ''}`;
    })
    .join('\n');
}

function renderWaitingList(espera) {
  return espera.map((entry) => `- ${entry.name}`).join('\n');
}

function render(state) {
  const lines = [
    '📌 LISTA COLMEIA – QUADRA',
    `🗓️ ${formatHeaderDate(state.gameWeekday)}`,
    `🕗 ${state.gameTime || 'Horario a definir'}`,
    '',
    '> LEVANTADORES',
    renderSlots(state.levantadores, 1),
    '',
    '> LISTA DE PRESENÇA',
    renderSlots(state.presenca, LEVANTADOR_SLOTS + 1),
    '',
    '> LISTA DE ESPERA',
    renderWaitingList(state.espera),
    '',
    '🚨 ATENÇÃO: Para garantirmos a reserva, o pagamento deverá ser feito até terça-feira (terça-feira da semana). Desde já agradecemos a colaboração de todos!',
    '',
    `Valor: ${state.price}`,
    `Pix: ${state.pixKey}`,
    state.pixName,
  ];

  return lines.join('\n');
}

module.exports = { options, manualKeywords, createState, removeVoter, placeVoter, addManual, removeManual, render };
