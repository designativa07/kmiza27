const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Simple server is working!',
    timestamp: new Date().toISOString()
  }));
});

const port = 3005;
server.listen(port, '0.0.0.0', () => {
  console.log(`Simple server running on port ${port}`);
}); 