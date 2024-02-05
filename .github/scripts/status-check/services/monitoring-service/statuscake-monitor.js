const fetchPreload = import('node-fetch').then(mod => mod.default)
const fetch = (...args) => fetchPreload.then(fn => fn(...args))

class StatuscakeMonitor {
  static async fetch(testData) {
    const response = await fetch(testData.url, {
      headers: {
        Authorization: `Bearer ${process.env.UPTIME_API_TOKEN}`
      }
    });
  
    if (response.status === 429) return;
    const json = await response.json();
    const data = json.data;
    if (data) return data;
  }
}

module.exports = StatuscakeMonitor;
