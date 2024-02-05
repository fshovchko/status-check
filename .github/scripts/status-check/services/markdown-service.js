class MarkdownService {
  static formatData(data) {
    return `
### Test type: ${data.test_type}
#### Status: ${data.status.toUpperCase()} ${data.status === 'up' ? '🟢' : '🔴'}
#### Tested at: ${new Date(data.last_tested_at).toUTCString()}
        `;
  }
}

module.exports = MarkdownService;
