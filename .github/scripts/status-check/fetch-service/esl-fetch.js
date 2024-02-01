const fetchPreload = import('node-fetch').then(mod => mod.default)
const fetch = (...args) => fetchPreload.then(fn => fn(...args))

class ESLFetch {
  static async fetch(testData) {
    try {
      const response = await fetch(testData.url);

      const contentType = response.headers.get('content-type');    
      if ( response.ok && contentType?.includes('application/json')) await response.json();
      else await response.text();
      return Object.assign(testData, {status:  response.ok ? 'up' : 'down', last_tested_at: Date.now()});
    } catch (e) {}
  }
}

module.exports = ESLFetch;
