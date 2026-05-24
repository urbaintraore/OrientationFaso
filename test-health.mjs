import http from 'http';

const req = http.request('http://localhost:3000/api/health', {
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.end();
