const individual = require('./individual');
const duplas = require('./duplas');

const modes = { individual, duplas };

function getMode(name) {
  return modes[name] || modes.individual;
}

module.exports = { getMode };
