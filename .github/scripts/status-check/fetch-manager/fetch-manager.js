const StatusCakeManager = require('./statuscake-fetch');
const ESLManager = require('./esl-manager');

class FetchManager {
  async checkStatus(testData) {
    switch (testData.fetch_type) {
      case 'statuscake':
        return StatusCakeManager.fetch(testData);
      case 'esl':
        return ESLManager.fetch(testData);
    }
  }
}

module.exports = FetchManager;
