const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Data siaran yang disimpan di server
let broadcastState = {
    vid: 'dQw4w9WgXcQ',
    time: 0,
    isPlaying: false,
    hostId: null
};

io.on('connection', (socket) => {
    // Kirim status saat ini ke user yang baru join
    socket.emit('init-state', broadcastState);

    socket.on('join-room', (name) => {
        socket.userName = name;
        // Jika belum ada host, jadikan orang pertama sebagai host
        if (!broadcastState.hostId) broadcastState.hostId = socket.id;
        io.emit('update-users', { users: Object.values(io.sockets.connected || {}).map(s => s.userName).filter(n => n), hostId: broadcastState.hostId });
    });

    // Hanya terima perintah jika dikirim oleh Host
    socket.on('host-command', (data) => {
        broadcastState.vid = data.vid || broadcastState.vid;
        broadcastState.time = data.time;
        broadcastState.isPlaying = data.isPlaying;
        broadcastState.hostId = socket.id; // Update host ke yang terakhir kasi perintah

        socket.broadcast.emit('sync-to-viewer', broadcastState);
    });

    socket.on('new-message', (data) => {
        socket.broadcast.emit('chat-receive', data);
    });

    socket.on('disconnect', () => {
        if (socket.id === broadcastState.hostId) broadcastState.hostId = null;
    });
});

http.listen(process.env.PORT || 3000, () => console.log("Streaming Server Ready!"));
