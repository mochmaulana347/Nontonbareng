const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {}; 
let videoStatus = {
    url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    currentTime: 0,
    playing: false
};

io.on('connection', (socket) => {
    
    socket.on('join-room', (username) => {
        users[socket.id] = { name: username, status: 'Watching' };
        io.emit('sys-log', `${username} bergabung!`);
        io.emit('update-users', Object.values(users));

        // Kirim info video terakhir ke user baru
        socket.emit('video-control', {
            action: 'change',
            url: videoStatus.url
        });
        
        // Jeda 2 detik agar player siap baru di-seek ke detik yang sama
        setTimeout(() => {
            socket.emit('video-control', {
                action: videoStatus.playing ? 'play' : 'pause',
                time: videoStatus.currentTime
            });
        }, 2000);
    });

    socket.on('video-control', (data) => {
        if (data.url) videoStatus.url = data.url;
        if (data.time !== undefined) videoStatus.currentTime = data.time;
        if (data.action === 'play') videoStatus.playing = true;
        if (data.action === 'pause') videoStatus.playing = false;
        socket.broadcast.emit('video-control', data);
    });

    socket.on('time-update', (time) => {
        videoStatus.currentTime = time;
    });

    // Fitur Canggih: Update Status (Watching/Away)
    socket.on('update-presence', (status) => {
        if (users[socket.id]) {
            users[socket.id].status = status;
            io.emit('update-users', Object.values(users));
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
            io.emit('sys-log', `${users[socket.id].name} keluar.`);
            delete users[socket.id];
            io.emit('update-users', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Server berjalan...'); });
