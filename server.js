const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');
const cors = require('cors');

app.use(cors());
app.use(express.static(__dirname));
let users = {};

// Proxy API Dramabos agar tembus dari Railway
app.get('/proxy/search', async (req, res) => {
    try {
        const response = await axios.get(`https://dramabos.asia/api/tensei/search?q=${req.query.q}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.json(response.data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/proxy/stream', async (req, res) => {
    try {
        const response = await axios.get(`https://dramabos.asia/api/tensei/stream/${req.query.id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
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

// Railway otomatis memberikan PORT, jika tidak ada pakai 3000
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
