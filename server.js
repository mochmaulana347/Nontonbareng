const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {};

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        users[socket.id] = { name, color: '#' + Math.floor(Math.random()*16777215).toString(16) };
        io.emit('update-users', Object.values(users));
    });

    socket.on('video-control', (data) => {
        socket.broadcast.emit('video-control', data);
    });

    socket.on('new-message', (data) => {
        socket.broadcast.emit('chat-receive', { ...data, color: users[socket.id]?.color });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

http.listen(process.env.PORT || 3000, () => console.log("Server Final Ready!"));
