const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {};

io.on('connection', (socket) => {
    socket.on('join-room', (name) => {
        users[socket.id] = name;
        io.emit('update-users', Object.values(users));
    });

    // Logika Inti: Broadcast langsung apa adanya
    socket.on('video-action', (data) => {
        socket.broadcast.emit('video-action', data);
    });

    socket.on('new-message', (data) => {
        socket.broadcast.emit('chat-receive', data);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

http.listen(process.env.PORT || 3000, () => console.log("Server Siap!"));
