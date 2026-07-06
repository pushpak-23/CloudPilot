const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`[Keystone Mock] Received ${req.method} request to ${req.url}`);
  
  if (req.method === 'POST' && req.url === '/v3/auth/tokens') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log(`[Keystone Mock] Req payload: ${body}`);
      let authReq;
      try {
        authReq = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: "Invalid JSON" } }));
        return;
      }

      const isTokenAuth = authReq?.auth?.identity?.methods?.includes("token");

      if (isTokenAuth) {
        const project = authReq?.auth?.scope?.project?.name || "admin";
        res.writeHead(201, {
          'Content-Type': 'application/json',
          'X-Subject-Token': 'mock-keystone-token-xyz-scoped'
        });
        res.end(JSON.stringify({
          token: {
            methods: ["token"],
            user: { id: "user-1", name: "admin" },
            project: { id: "proj-scoped-id", name: project },
            roles: [
              { id: "role-1", name: "admin" }
            ],
            catalog: [],
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }
        }));
        return;
      }
      
      const username = authReq?.auth?.identity?.password?.user?.name || "admin";
      const project = authReq?.auth?.scope?.project?.name || "admin";
      const password = authReq?.auth?.identity?.password?.user?.password;
      
      // Allow 'secret' or 'admin' as valid mock credentials
      if (password === 'secret' || password === 'admin') {
        res.writeHead(201, {
          'Content-Type': 'application/json',
          'X-Subject-Token': 'mock-keystone-token-xyz-987'
        });
        res.end(JSON.stringify({
          token: {
            methods: ["password"],
            user: { id: "user-1", name: username },
            project: { id: "proj-1", name: project },
            roles: [
              { id: "role-1", name: "admin" },
              { id: "role-2", name: "member" }
            ],
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: {
            code: 401,
            title: "Unauthorized",
            message: "The credentials supplied were invalid."
          }
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: "Not Found" } }));
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Keystone Mock Server listening on port 5000');
});
