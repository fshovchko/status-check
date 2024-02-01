const StatusCakeFetch = require('./statuscake-fetch');
const ESLFetch = require('./esl-fetch');

class FetchService {
  static #instance;

  static create() {
    if (this.#instance) return this.#instance;
    return this.#instance = new FetchService();
  }

  async checkStatus(testData) {
    switch (testData.fetch_type) {
      case 'statuscake':
        return StatusCakeFetch.fetch(testData);
      case 'esl':
        return ESLFetch.fetch(testData);
    }
  }
}

module.exports = FetchService;
