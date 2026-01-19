const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {}; 
let videoStatus = {
    url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    currentTime: 0,
    playing: false,
    adminId: null
};

io.on('connection', (socket) => {
    
    socket.on('join-room', (username) => {
        users[socket.id] = { name: username, status: 'Watching', joinedAt: Date.now(), isAdmin: false };
        
        const sortedUsers = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
        videoStatus.adminId = sortedUsers[0][0];
        
        // Reset semua status admin, lalu set yang baru
        Object.keys(users).forEach(id => users[id].isAdmin = (id === videoStatus.adminId));

        io.emit('sys-log', `${username} bergabung!`);
        io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });

        socket.emit('video-control', { action: 'change', url: videoStatus.url });
        setTimeout(() => {
            socket.emit('video-control', { action: videoStatus.playing ? 'play' : 'pause', time: videoStatus.currentTime });
        }, 2000);
    });

    // FITUR: Ambil alih admin secara manual
    socket.on('claim-admin', () => {
        videoStatus.adminId = socket.id;
        Object.keys(users).forEach(id => users[id].isAdmin = (id === videoStatus.adminId));
        io.emit('sys-log', `${users[socket.id].name} sekarang menjadi Admin.`);
        io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });
    });

    socket.on('video-control', (data) => {
        if (socket.id === videoStatus.adminId) {
            if (data.url) videoStatus.url = data.url;
            if (data.action === 'play') videoStatus.playing = true;
            if (data.action === 'pause') videoStatus.playing = false;
            if (data.time !== undefined) videoStatus.currentTime = data.time;
            socket.broadcast.emit('video-control', data);
        }
    });

    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', { user: users[socket.id]?.name || "Anonim", msg: msg });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            delete users[socket.id];
            const remaining = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
            if (remaining.length > 0) {
                videoStatus.adminId = remaining[0][0];
                users[videoStatus.adminId].isAdmin = true;
            }
            io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Server nyala...'); });
