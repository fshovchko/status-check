const fetchPreload = import('node-fetch').then(mod => mod.default)
const fetch = (...args) => fetchPreload.then(fn => fn(...args))

class FetchService {
  static #instance;

  static create() {
    if (this.#instance) return this.#instance;
    return this.#instance = new FetchService();
  }

  async checkStatus(testObj) {
    return /statuscake/.test(testObj.url) ? await this.getUptimeStatus(testObj) : await this.getWebsiteContent(testObj);
  }

  async getUptimeStatus(testObj) {
    const response = await fetch(testObj.url, {
      headers: {
        Authorization: `Bearer ${process.env.UPTIME_API_TOKEN}`
      }
    });
  
    if (response.status === 429) return;
    const json = await response.json();
    const data = json.data;
    if (data) return Object.assign(data);
  }

  async getWebsiteContent(testObj) {
    try {
      const response = await fetch(testObj.url);

      const contentType = response.headers.get('content-type');    
      if ( response.ok && contentType?.includes('application/json')) await response.json();
      else await response.text();
      return Object.assign(testObj, {status:  response.ok ? 'up' : 'down', last_tested_at: Date.now()});
    } catch (e) {}
  }
}

module.exports = FetchService;
