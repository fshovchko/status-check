const StatusCheckService = require('./status-check-service');
const config = require('./check-status.config.json');

async function performStatusChecks() {
  const statusCheck = new StatusCheckService();
  for (const testObj of config.tests) await statusCheck.checkStatus(testObj);
  statusCheck.closeIssue();
}

performStatusChecks();
