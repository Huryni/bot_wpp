const WEEKDAY_NAMES_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const WEEKDAY_ALIASES = {
  domingo: 0,
  dom: 0,
  segunda: 1,
  'segunda-feira': 1,
  seg: 1,
  terca: 2,
  'terça': 2,
  'terca-feira': 2,
  'terça-feira': 2,
  ter: 2,
  quarta: 3,
  'quarta-feira': 3,
  qua: 3,
  quinta: 4,
  'quinta-feira': 4,
  qui: 4,
  sexta: 5,
  'sexta-feira': 5,
  sex: 5,
  sabado: 6,
  'sábado': 6,
  sab: 6,
};

function parseWeekday(value) {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return key in WEEKDAY_ALIASES ? WEEKDAY_ALIASES[key] : null;
}

function nextOccurrence(weekdayIndex, from = new Date()) {
  const result = new Date(from);
  const diff = (weekdayIndex - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function formatHeaderDate(gameWeekday) {
  const weekdayIndex = parseWeekday(gameWeekday);

  if (weekdayIndex === null) {
    return gameWeekday || 'Dia a definir';
  }

  const date = nextOccurrence(weekdayIndex);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const name = WEEKDAY_NAMES_PT[weekdayIndex];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return `${capitalized} – ${day}/${month}`;
}

module.exports = { formatHeaderDate };
