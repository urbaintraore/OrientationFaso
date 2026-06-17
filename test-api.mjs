import http from 'http';

const req = http.request('http://localhost:3000/api/gemini/crawl-scholarship-market', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data.substring(0, 500) + '...'));
});

req.write(JSON.stringify({ academicYears: ['2025/2026'] }));
req.end();
