const CLIService = require('./cli-service');
const MonitoringService = require('./monitoring-service/monitoring-service');
const MarkdownService = require('./markdown-service');

const statusDate = 'STATUS_REPORT_DATE';

class StatusCheckService {
  cli = new CLIService();
  monitor = new MonitoringService();

  isEveryStatusUp = true;

  async updateIssue(testData) {
    if (testData.status === 'down') this.isEveryStatusUp = false;
    if (!this.cli.issue && testData.status !== 'up') await this.createIssue(testData);
    else if (this.cli.issue) this.createComment(testData);
  }

  async createIssue(testData) {
    const date = parseInt(this.cli.getVariable(statusDate), 10);
    if (date && date + (30 * 60 * 1000) > Date.now()) return;
    await this.cli.createIssue(MarkdownService.formatData(testData));
  }

  async checkStatus(testData) {
    const fetchedData = await this.monitor.checkStatus(testData);
    await this.updateIssue(fetchedData);
  }

  createComment(testData) {
    const comments = this.cli.comments.filter((comment) => (/Test type: (.*)/i.exec(comment.body) || [])[1] === testData.test_type);
    const lastComment = comments[comments.length-1];
    if (!lastComment && testData.status === 'up') return;
    if ((/Status: (.*) /i.exec(lastComment?.body) || [])[1]?.toLowerCase() === testData.status) return;
    this.cli.addComment(MarkdownService.formatData(testData));
  }

  closeIssue() {
    if (!(this.isEveryStatusUp && this.cli.issue)) return;
    this.cli.updateVariable(statusDate, JSON.stringify(Date.now()));
    this.cli.closeIssue();
  }
}

module.exports = StatusCheckService;
