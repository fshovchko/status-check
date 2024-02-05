const StatusCakeMonitor = require('./statuscake-monitor');
const HttpFetchMonitor = require('./http-monitor');

class MonitoringService {
  async checkStatus(testData) {
    switch (testData.provider) {
      case 'statuscake':
        return StatusCakeMonitor.fetch(testData);
      case 'esl':
        return HttpFetchMonitor.fetch(testData);
    }
  }
}

module.exports = MonitoringService;
