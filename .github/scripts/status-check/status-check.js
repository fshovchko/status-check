const StatusCheckService = require('./services/status-check-service');
const config = require('./check-status.config.json');

async function performStatusChecks() {
  const service = new StatusCheckService(config.issue);
  for (const testObj of config.tests) await service.checkStatus(testObj);
  service.closeIssue();
}

performStatusChecks();
