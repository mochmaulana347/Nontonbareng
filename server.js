const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {};
// OBJEK UNTUK NYIMPEN STATUS VIDEO
let videoStatus = {
    url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    currentTime: 0,
    playing: false
};

io.on('connection', (socket) => {
    
    socket.on('join-room', (username) => {
        users[socket.id] = username;
        io.emit('sys-log', `${username} bergabung!`);
        io.emit('update-users', Object.values(users));

        // OTOMATIS: Kirim status video terakhir ke orang yang baru join
        socket.emit('video-control', {
            action: 'change',
            url: videoStatus.url
        });
        
        // Kasih jeda dikit biar videonya ke-load dulu baru di-seek ke detiknya
        setTimeout(() => {
            socket.emit('video-control', {
                action: videoStatus.playing ? 'play' : 'pause',
                time: videoStatus.currentTime
            });
        }, 2000); 
    });

    socket.on('video-control', (data) => {
        // Update status di server setiap ada perubahan
        if (data.url) videoStatus.url = data.url;
        if (data.time !== undefined) videoStatus.currentTime = data.time;
        if (data.action === 'play') videoStatus.playing = true;
        if (data.action === 'pause') videoStatus.playing = false;

        socket.broadcast.emit('video-control', data);
    });

    // Kirim update detik berkala dari salah satu user (biar server tau detik terakhir)
    socket.on('time-update', (time) => {
        videoStatus.currentTime = time;
    });

    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', { user: users[socket.id] || "Anonim", msg: msg });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('sys-log', `${users[socket.id]} keluar.`);
            delete users[socket.id];
            io.emit('update-users', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Server nyala di port ' + PORT); });
