const {execSync} = require('child_process');

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const botName = 'esl-statuscheck-bot';

class CLIService {
  issueConfig;

  _issue;
  _issueNumber;
  _comments;

  constructor(issueConfig) {
    this.issueConfig = issueConfig;
  }

  get issue() {
    if (this._issue) return this._issue;
    return this._issue = JSON.parse(execSync(`gh issue list --repo ${owner}/${repo} --label "${this.issueConfig.label}" --app ${botName} --state open --json number,title`, { encoding: 'utf-8' }))[0];
  }

  get issueNumber() {
    return this._issueNumber || this.issue?.number;
  }

  get comments() {
    if (this._comments) return this._comments;
    const {comments, body, author} = JSON.parse(execSync(`gh issue view ${this.issueNumber} -c --json comments,body,author`, { encoding: 'utf-8' }));
    return this._comments = comments.concat([{body, author}]);
  }

  addComment(commentBody) {
    execSync(`gh issue comment ${this.issueNumber} --repo ${owner}/${repo} --body "${commentBody}"`);
  }

  async createIssue(issueBody) {
    const {title, label, assignee} = this.issueConfig;
    // exadel-inc/esl-core-team, 
    execSync(`gh issue create --repo ${owner}/${repo} --title "${title}" --body "${issueBody}" --label "${label}" --assignee ${assignee}`);
    await this.awaitIssue();
  }

  awaitIssue() {
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

  closeIssue() {
    if (this.issueNumber) execSync(`gh issue close ${this.issueNumber}`);
  }

  getVariable(name) {
    return process.env[name];
  }

  updateVariable(name, value) {
    if (this.getVariable(name)) execSync(`gh variable delete ${name}`);
    execSync(`gh variable set ${name} --body "${value}"`);
  }
}

module.exports = CLIService;
