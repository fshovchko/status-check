const StatusCheckService = require('./services/status-check-service');
const DataFormatter = require('./services/data-formatter');
const config = require('./check-status.config.json');

async function performStatusChecks() {
  const service = new StatusCheckService(config.issue, DataFormatter.getMarkdown);
  for (const testObj of config.tests) await service.checkStatus(testObj);
  service.closeIssue();
}

performStatusChecks();
