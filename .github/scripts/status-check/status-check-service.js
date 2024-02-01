const CLIService = require('./cli-service');
const FetchService = require('./fetch-service');

const statusDate = 'STATUS_REPORT_DATE';

class StatusCheckService {
  #isEveryStatusUp = true;
  #cliService = CLIService.create();
  #fetchService = FetchService.create();

  static #instance;

  static create() {
    if (this.#instance) return this.#instance;
    return this.#instance = new StatusCheckService();
  }

  async updateIssue(body) {
    if (body.status === 'down') this.#isEveryStatusUp = false;
    if (!this.#cliService.issue && body.status !== 'up') await this.createIssue(body);
    else if (this.#cliService.issue) this.createComment(body);
  }

  async createIssue(body) {
    const date = parseInt(this.#cliService.getVariable(statusDate), 10);
    if (date && date + (30 * 60 * 1000) > Date.now()) return;
    // exadel-inc/esl-core-team, 
    await this.#cliService.createIssue(this.formatData(body));
  }

  createComment(body) {
    const comments = this.#cliService.comments.filter((comment) => (/Test type: (.*)/i.exec(comment.body) || [])[1] === body.test_type);
    const lastComment = comments[comments.length-1];
    if (!lastComment && body.status === 'up') return;
    if ((/Status: (.*) /i.exec(lastComment?.body) || [])[1]?.toLowerCase() === body.status) return;
    this.#cliService.addComment(this.formatData(body));
  }

  closeIssue() {
    if (!(this.#isEveryStatusUp && this.#cliService.issue)) return;
    this.#cliService.updateVariable(statusDate, JSON.stringify(Date.now()));
    this.#cliService.closeIssue();
  }

  async checkStatus(testObj) {
    const fetchedData = await this.#fetchService.checkStatus(testObj);
    await this.updateIssue(fetchedData);
  }

  formatData(body) {
    return `
### Test type: ${body.test_type}
#### Status: ${body.status.toUpperCase()} ${body.status === 'up' ? '🟢' : '🔴'}
#### Tested at: ${new Date(body.last_tested_at).toUTCString()}
        `;
  }
}

module.exports = StatusCheckService;
