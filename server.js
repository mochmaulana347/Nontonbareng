const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {}; 
let videoStatus = {
    url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    lastTime: 0,
    lastUpdate: Date.now(),
    playing: false,
    adminId: null
};

// Fungsi menghitung waktu asli video saat ini di server
function getEstimatedTime() {
    if (!videoStatus.playing) return videoStatus.lastTime;
    const elapsed = (Date.now() - videoStatus.lastUpdate) / 1000;
    return videoStatus.lastTime + elapsed;
}

io.on('connection', (socket) => {
    socket.on('join-room', (username) => {
        users[socket.id] = { name: username, status: 'Watching', joinedAt: Date.now(), isAdmin: false };
        const sorted = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
        videoStatus.adminId = sorted[0][0];
        Object.keys(users).forEach(id => users[id].isAdmin = (id === videoStatus.adminId));

        io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });

        // Kirim status awal
        socket.emit('video-control', {
            action: 'change',
            url: videoStatus.url,
            time: getEstimatedTime(),
            playing: videoStatus.playing
        });
    });

    socket.on('video-control', (data) => {
        if (socket.id === videoStatus.adminId) {
            videoStatus.lastTime = data.time || 0;
            videoStatus.lastUpdate = Date.now();
            if (data.action === 'play') videoStatus.playing = true;
            if (data.action === 'pause') videoStatus.playing = false;
            if (data.url) videoStatus.url = data.url;

            socket.broadcast.emit('video-control', data);
        }
    });

    // Admin lapor posisi secara berkala (Heartbeat)
    socket.on('heartbeat', (time) => {
        if (socket.id === videoStatus.adminId) {
            videoStatus.lastTime = time;
            videoStatus.lastUpdate = Date.now();
        }
    });

    socket.on('claim-admin', () => {
        videoStatus.adminId = socket.id;
        Object.keys(users).forEach(id => users[id].isAdmin = (id === videoStatus.adminId));
        io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });
    });

    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', { user: users[socket.id]?.name || "Anonim", msg });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        const remaining = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
        if (remaining.length > 0) videoStatus.adminId = remaining[0][0];
        io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });
    });
});

http.listen(process.env.PORT || 3000);
