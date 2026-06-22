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
    const message = process.env[`MESSAGE_${index}`];

    if (groupId && message) {
      jobs.push({ groupId, message });
    }
  });

  if (jobs.length === 0 && process.env.GROUP_ID && process.env.MESSAGE) {
    jobs.push({ groupId: process.env.GROUP_ID, message: process.env.MESSAGE });
  }

  return jobs;
}

const config = {
  jobs: buildJobs(),
  schedule: process.env.SCHEDULE || '0 9 * * 0',
  timezone: process.env.TIMEZONE || 'America/Fortaleza',
};

module.exports = config;
