const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Menyimpan status video agar sinkron untuk semua
let roomState = {
    vid: 'dQw4w9WgXcQ',
    time: 0,
    playing: false,
    lastUpdate: Date.now()
};

io.on('connection', (socket) => {
    // Saat ada yang baru masuk, langsung kasih status video saat ini
    socket.emit('init-state', roomState);

    socket.on('join-room', (name) => {
        socket.userName = name;
        updateUserList();
    });

    socket.on('video-command', (data) => {
        roomState = { ...roomState, ...data, lastUpdate: Date.now() };
        // Kirim ke semua orang KECUALI pengirim untuk mencegah feedback loop
        socket.broadcast.emit('video-sync', roomState);
    });

    socket.on('new-message', (data) => {
        socket.broadcast.emit('chat-receive', data);
    });

    socket.on('disconnect', () => {
        updateUserList();
    });

    function updateUserList() {
        const users = [];
        for (let [id, s] of io.sockets.sockets) {
            if (s.userName) users.push(s.userName);
        }
        io.emit('update-users', users);
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server Final Ready on port ${PORT}`));
