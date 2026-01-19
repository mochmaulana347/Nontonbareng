const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {};
let lastState = {
    url: '',
    time: 0,
    playing: false,
    updatedAt: Date.now()
};

io.on('connection', (socket) => {
    socket.on('join-room', (name) => {
        users[socket.id] = name;
        // Kirim status terakhir ke user yang baru join
        const elapsed = lastState.playing ? (Date.now() - lastState.updatedAt) / 1000 : 0;
        socket.emit('init-sync', {
            url: lastState.url,
            time: lastState.time + elapsed,
            playing: lastState.playing
        });
    });

    socket.on('video-update', (data) => {
        lastState = {
            url: data.url,
            time: data.time,
            playing: data.action === 'play',
            updatedAt: Date.now()
        };
        // Sebarkan ke yang lain
        socket.broadcast.emit('video-control', data);
    });

    socket.on('disconnect', () => { delete users[socket.id]; });
});

http.listen(process.env.PORT || 3000);
