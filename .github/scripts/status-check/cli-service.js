const { execSync } = require('child_process');

const repository = process.env.GITHUB_REPOSITORY;
const [owner, repo] = repository.split('/');

const botName = 'esl-statuscheck-bot';

class CLIService {
  label = 'website status';

  _issue;
  _issueNumber;
  _comments;

  get issue() {
    if (this._issue) return this._issue;
    return this._issue = JSON.parse(execSync(`gh issue list --repo ${owner}/${repo} --label "${this.label}" --app ${botName} --state open --json number,title`, { encoding: 'utf-8' }))[0];
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
    execSync(`gh issue create --repo ${owner}/${repo} --title "Website Down" --body "${issueBody}" --label "${this.label}" --assignee fshovchko`);
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

  getVariable(varName) {
    return process.env[varName];
  }

  updateVariable(varName, data) {
    if (this.getVariable(varName)) execSync(`gh variable delete ${varName}`);
    execSync(`gh variable set ${varName} --body "${data}"`);
  }
}

module.exports = CLIService;
