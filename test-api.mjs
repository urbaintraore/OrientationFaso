import http from 'http';

const req = http.request('http://localhost:3000/api/gemini/crawl-career-opportunities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.write(JSON.stringify({ targetKeyword: 'test' }));
req.end();
