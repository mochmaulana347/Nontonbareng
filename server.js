const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios'); // Tambahkan axios (npm install axios)

app.use(express.static(__dirname));
let users = {};

// PROXY API: Agar tidak kena CORS
app.get('/api/search', async (req, res) => {
    try {
        const response = await axios.get(`https://dramabos.asia/api/tensei/search?q=${req.query.q}`);
        res.json(response.data);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/watch', async (req, res) => {
    try {
        const response = await axios.get(`https://dramabos.asia/api/tensei/stream/${req.query.id}`);
        res.json(response.data);
    } catch (e) { res.status(500).send(e.message); }
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
    socket.on('disconnect', () => { delete users[socket.id]; io.emit('update-users', Object.values(users)); });
});

http.listen(3000, () => console.log("Server Ready di Port 3000"));
