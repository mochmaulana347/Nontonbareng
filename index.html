const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {};
let roomState = {
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    time: 0,
    playing: false,
    updatedAt: Date.now()
};

io.on('connection', (socket) => {
    socket.on('join-room', (name) => {
        users[socket.id] = { name: name, joinedAt: Date.now() };
        
        // Hitung estimasi waktu sekarang untuk yang baru join
        let estimatedTime = roomState.time;
        if (roomState.playing) {
            estimatedTime += (Date.now() - roomState.updatedAt) / 1000;
        }

        io.emit('update-users', Object.values(users));
        socket.emit('video-command', {
            action: 'initial-sync',
            url: roomState.url,
            time: estimatedTime,
            playing: roomState.playing
        });
    });

    socket.on('video-command', (data) => {
        roomState = {
            url: data.url || roomState.url,
            time: data.time,
            playing: (data.action === 'play'),
            updatedAt: Date.now()
        };
        socket.broadcast.emit('video-command', data);
    });

    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', { user: users[socket.id]?.name || "Anonim", msg });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

http.listen(process.env.PORT || 3000);
