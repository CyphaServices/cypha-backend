const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://app.cyphaent.com')
  .split(',').map(s => s.trim());

app.use(cors({ origin: allowed, credentials: true }));
app.get('/health', (_, res) => res.json({ ok: true, at: new Date().toISOString() }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowed, methods: ['GET','POST'] }
});

// tiny demo presence by code
io.on('connection', socket => {
  socket.on('join-session', ({ code }) => {
    if (!code) return;
    const room = `session:${code}`;
    socket.join(room);
    const size = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit('presence', { code, count: size });
  });

  socket.on('host-event', ({ code, payload }) => {
    const room = `session:${code}`;
    io.to(room).emit('event', payload);
  });
});

const port = process.env.PORT || 3001;   // <-- use 3001 (Next uses 3000)
server.listen(port, () => console.log('API listening on', port));