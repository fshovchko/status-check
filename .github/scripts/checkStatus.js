const fetchPreload = import('node-fetch').then(mod => mod.default)
const fetch = (...args) => fetchPreload.then(fn => fn(...args))
const { execSync } = require('child_process');

const repository = process.env.GITHUB_REPOSITORY;
const [owner, repo] = repository.split('/');
const statusDate = 'STATUS_REPORT_DATE';

const label = 'website status';
const botName = 'esl-statuscheck-bot';

class StatusCheck {
  static #issue;
  static #issueNumber;
  static #comments;

  static isEveryStatusUp = true;

  static get issue() {
    if (this.#issue) return this.#issue;
    return this.#issue = JSON.parse(execSync(`gh issue list --repo ${owner}/${repo} --label "${label}" --app ${botName} --state open --json number,title`, { encoding: 'utf-8' }))[0];
  }

  static get issueNumber() {
    return this.#issueNumber || this.issue?.number;
  }

  static get comments() {
    if (this.#comments) return this.#comments;
    const {comments, body, author} = JSON.parse(execSync(`gh issue view ${this.issueNumber} -c --json comments,body,author`, { encoding: 'utf-8' }));
    return this.#comments = comments.concat([{body, author}]);
  }

  static async checkStatus(url, data) {
    /statuscake/.test(url) ? await this.getUptimeStatus(url) : await this.getWebsiteContent(url, data);
  }

  static async getUptimeStatus(testURL) {
    const response = await fetch(testURL, {
      headers: {
        Authorization: `Bearer ${process.env.UPTIME_API_TOKEN}`
      }
    });
  
    if (response.status === 429) return;
    const json = await response.json();
    const data = json.data;
    if (!data) return;
    await this.updateIssue(data);
  }

  static async getWebsiteContent(scriptUrl, data) {
    try {
      const response = await fetch(scriptUrl);
      await this.updateIssue(Object.assign(data, {status:  response.ok ? 'up' : 'down', last_tested_at: Date.now()}));
      await response.json();
    } catch (e) {}
  }

  static async updateIssue(body) {
    if (body.status === 'down') this.isEveryStatusUp = false;
    if (!this.issue && body.status !== 'up') await this.createIssue(body);
    else if (this.issue) this.createComment(body);
  }

  static async createIssue(body) {
    const date = process.env[statusDate];
    if (date && date + 1800 * 1000 > Date.now()) return;
    // exadel-inc/esl-core-team, 
    execSync(`gh issue create --repo ${owner}/${repo} --title "Website Down" --body "${this.formatData(body)}" --label "${label}" --assignee fshovchko`, { encoding: 'utf-8' });
    await this.awaitIssue();
  }

  static createComment(body) {
    const comments = this.comments.filter((comment) => (/Test type: (.*)/i.exec(comment.body) || [])[1] === body.test_type);
    const lastComment = comments[comments.length-1];
    if (!lastComment && body.status === 'up') return;
    if ((/Status: (.*) /i.exec(lastComment?.body) || [])[1]?.toLowerCase() === body.status) return;
    execSync(`gh issue comment ${this.issueNumber} --repo ${owner}/${repo} --body "${this.formatData(body)}"`, { stdio: 'inherit' });
  }

  static awaitIssue() {
    return new Promise((resolve, reject) => {
      let timePassed = 0;

      const check = () => {
        timePassed += 100;
        if (this.issue) {
          clearInterval(intervalId);
          resolve(this.issue);
        }

        if (timePassed < 10000) return;
        clearInterval(intervalId);
        reject(new Error('Timeout: 10000ms passed, issue wasn`t created'));
      };

      const intervalId = setInterval(check, 100);
    });
  }

  static closeIssue() {
    if (!(this.isEveryStatusUp && this.issue)) return;
    if (process.env[statusDate]) execSync(`gh variable delete ${statusDate}`);
    execSync(`gh variable set ${statusDate} --body "${JSON.stringify(Date.now())}"`);
    execSync(`gh issue close ${this.issueNumber}`, { stdio: 'inherit' });
  }

  static formatData(body) {
    return `
### Test type: ${body.test_type}
#### Status: ${body.status.toUpperCase()} ${body.status === 'up' ? '🟢' : '🔴'}
#### Tested at: ${new Date(body.last_tested_at).toUTCString()}
        `;
  }
}

async function doStatusChecks() {
  const root = require('./checkStatus.json');
  for (const test of root.tests) await StatusCheck.checkStatus(test.url, test.data);
  StatusCheck.closeIssue();
}

doStatusChecks();
