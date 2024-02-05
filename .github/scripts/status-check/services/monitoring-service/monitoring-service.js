const StatusCakeMonitor = require('./statuscake-monitor');
const ESLMonitor = require('./esl-monitor');

class MonitoringService {
  async checkStatus(testData) {
    switch (testData.fetch_type) {
      case 'statuscake':
        return StatusCakeMonitor.fetch(testData);
      case 'esl':
        return ESLMonitor.fetch(testData);
    }
  }
}

module.exports = MonitoringService;
