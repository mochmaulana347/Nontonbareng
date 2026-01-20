const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');

app.use(express.static(__dirname));
let users = {};

// Jembatan (Proxy) API agar tidak gagal memuat (CORS)
app.get('/proxy/search', async (req, res) => {
    try {
        const response = await axios.get(`https://dramabos.asia/api/tensei/search?q=${req.query.q}`);
        res.json(response.data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/proxy/stream', async (req, res) => {
    try {
        const response = await axios.get(`https://dramabos.asia/api/tensei/stream/${req.query.id}`);
        res.json(response.data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        users[socket.id] = { name, color: '#' + Math.floor(Math.random()*16777215).toString(16) };
        io.emit('update-users', Object.values(users));
    });
    socket.on('video-control', (data) => { socket.broadcast.emit('video-control', data); });
    socket.on('new-message', (data) => {
        socket.broadcast.emit('chat-receive', { ...data, color: users[socket.id]?.color });
    });
    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server Ready di Port ${PORT}`));
