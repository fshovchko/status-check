const CLIService = require('./cli-service');
const FetchManager = require('./fetch-manager/fetch-manager');

const statusDate = 'STATUS_REPORT_DATE';

class StatusCheckService {
  cliService = new CLIService();
  fetchService = new FetchManager();

  isEveryStatusUp = true;

  async updateIssue(testData) {
    if (testData.status === 'down') this.isEveryStatusUp = false;
    if (!this.cliService.issue && testData.status !== 'up') await this.createIssue(testData);
    else if (this.cliService.issue) this.createComment(testData);
  }

  async createIssue(testData) {
    const date = parseInt(this.cliService.getVariable(statusDate), 10);
    if (date && date + (30 * 60 * 1000) > Date.now()) return;
    // exadel-inc/esl-core-team, 
    await this.cliService.createIssue(this.formatData(testData));
  }

  createComment(testData) {
    const comments = this.cliService.comments.filter((comment) => (/Test type: (.*)/i.exec(comment.body) || [])[1] === testData.test_type);
    const lastComment = comments[comments.length-1];
    if (!lastComment && testData.status === 'up') return;
    if ((/Status: (.*) /i.exec(lastComment?.body) || [])[1]?.toLowerCase() === testData.status) return;
    this.cliService.addComment(this.formatData(testData));
  }

  closeIssue() {
    if (!(this.isEveryStatusUp && this.cliService.issue)) return;
    this.cliService.updateVariable(statusDate, JSON.stringify(Date.now()));
    this.cliService.closeIssue();
  }

  async checkStatus(testData) {
    const fetchedData = await this.fetchService.checkStatus(testData);
    await this.updateIssue(fetchedData);
  }

  formatData(testData) {
    return `
### Test type: ${testData.test_type}
#### Status: ${testData.status.toUpperCase()} ${testData.status === 'up' ? '🟢' : '🔴'}
#### Tested at: ${new Date(testData.last_tested_at).toUTCString()}
        `;
  }
}

module.exports = StatusCheckService;
