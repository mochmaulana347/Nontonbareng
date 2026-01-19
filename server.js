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
        users[socket.id] = { 
            name: username, 
            status: 'Watching', 
            joinedAt: Date.now(),
            isAdmin: false 
        };
        
        // Tentukan siapa Admin (orang yang paling lama/pertama join)
        const sortedUsers = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
        videoStatus.adminId = sortedUsers[0][0];
        users[videoStatus.adminId].isAdmin = true;

        io.emit('sys-log', `${username} bergabung!`);
        io.emit('update-users', { 
            users: Object.values(users), 
            adminId: videoStatus.adminId 
        });

        // Kirim status video saat ini ke pendatang baru
        socket.emit('video-control', {
            action: 'change',
            url: videoStatus.url,
            isAdmin: socket.id === videoStatus.adminId
        });
        
        setTimeout(() => {
            socket.emit('video-control', {
                action: videoStatus.playing ? 'play' : 'pause',
                time: videoStatus.currentTime
            });
        }, 2000);
    });

    socket.on('video-control', (data) => {
        // HANYA TERIMA KONTROL DARI ADMIN
        if (socket.id === videoStatus.adminId) {
            if (data.url) videoStatus.url = data.url;
            if (data.action === 'play') videoStatus.playing = true;
            if (data.action === 'pause') videoStatus.playing = false;
            if (data.time !== undefined) videoStatus.currentTime = data.time;

            socket.broadcast.emit('video-control', data);
        }
    });

    socket.on('update-presence', (status) => {
        if (users[socket.id]) {
            users[socket.id].status = status;
            io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });
        }
    });

    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', { 
            user: users[socket.id] ? users[socket.id].name : "Anonim", 
            msg: msg 
        });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const wasAdmin = socket.id === videoStatus.adminId;
            delete users[socket.id];
            
            const remaining = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
            if (remaining.length > 0) {
                videoStatus.adminId = remaining[0][0];
                users[videoStatus.adminId].isAdmin = true;
            } else {
                videoStatus.adminId = null;
            }
            
            io.emit('update-users', { users: Object.values(users), adminId: videoStatus.adminId });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Server Admin-Only Nyala...'); });
