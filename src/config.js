require('dotenv').config();

function buildJobs() {
  const jobs = [];
  const indexPattern = /^GROUP_ID_(\d+)$/;

  const indexes = Object.keys(process.env)
    .map((key) => {
      const match = key.match(indexPattern);
      return match ? Number(match[1]) : null;
    })
    .filter((index) => index !== null)
    .sort((a, b) => a - b);

  indexes.forEach((index) => {
    const groupId = process.env[`GROUP_ID_${index}`];
    if (!groupId) return;

    jobs.push({
      groupId,
      mode: process.env[`GAME_MODE_${index}`] || 'individual',
      gameWeekday: process.env[`GAME_WEEKDAY_${index}`] || '',
      gameTime: process.env[`GAME_TIME_${index}`] || '',
      price: process.env[`PRICE_${index}`] || process.env.PRICE || '',
      pixKey: process.env[`PIX_KEY_${index}`] || process.env.PIX_KEY || '',
      pixName: process.env[`PIX_NAME_${index}`] || process.env.PIX_NAME || '',
    });
  });

  if (jobs.length === 0 && process.env.GROUP_ID) {
    jobs.push({
      groupId: process.env.GROUP_ID,
      mode: process.env.GAME_MODE || 'individual',
      gameWeekday: process.env.GAME_WEEKDAY || '',
      gameTime: process.env.GAME_TIME || '',
      price: process.env.PRICE || '',
      pixKey: process.env.PIX_KEY || '',
      pixName: process.env.PIX_NAME || '',
    });
  }

  return jobs;
}

const config = {
  jobs: buildJobs(),
  schedule: process.env.SCHEDULE || '0 9 * * 0',
  timezone: process.env.TIMEZONE || 'America/Fortaleza',
  pollDebounceMs: (Number(process.env.POLL_DEBOUNCE_SECONDS) || 5) * 1000,
};

module.exports = config;
