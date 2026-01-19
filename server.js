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
    hostId: null // Kita simpan siapa bosnya
};

io.on('connection', (socket) => {
    
    socket.on('join-room', (username) => {
        users[socket.id] = { name: username, status: 'Watching', joinedAt: Date.now() };
        
        // Tentukan Host: User yang paling lama di room (joinedAt terkecil)
        const allUsers = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
        videoStatus.hostId = allUsers[0][0];

        io.emit('sys-log', `${username} bergabung!`);
        io.emit('update-users', Object.values(users));

        // Kirim info video terakhir ke user baru
        socket.emit('video-control', {
            action: 'change',
            url: videoStatus.url
        });
        
        setTimeout(() => {
            socket.emit('video-control', {
                action: videoStatus.playing ? 'play' : 'pause',
                time: videoStatus.currentTime
            });
        }, 2000);
    });

    socket.on('video-control', (data) => {
        // Biar nggak tabrakan, hanya simpan status kalau ada aksi nyata (klik play/pause/ganti)
        if (data.url) videoStatus.url = data.url;
        if (data.action === 'play') videoStatus.playing = true;
        if (data.action === 'pause') videoStatus.playing = false;
        if (data.time !== undefined && data.action === 'seek') videoStatus.currentTime = data.time;

        socket.broadcast.emit('video-control', data);
    });

    // Sinkronisasi Detik: Hanya terima laporan dari sang Host
    socket.on('time-update', (time) => {
        if (socket.id === videoStatus.hostId) {
            videoStatus.currentTime = time;
        }
    });

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
            delete users[socket.id];
            // Jika host keluar, cari host baru
            const remaining = Object.entries(users).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
            if (remaining.length > 0) videoStatus.hostId = remaining[0][0];
            
            io.emit('update-users', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Server nyala...'); });
