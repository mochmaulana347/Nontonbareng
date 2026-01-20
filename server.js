const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {};
let videoQueue = []; // Antrean video

io.on('connection', (socket) => {
    
    // Kirim antrean saat ini ke user yang baru join
    socket.emit('update-queue', videoQueue);

    socket.on('join', (name) => {
        users[socket.id] = { 
            name, 
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            status: 'active' 
        };
        io.emit('update-users', Object.values(users));
        io.emit('system-log', `${name} bergabung ke pesta 🟢`);
    });

    // QUEUE LOGIC
    socket.on('add-to-queue', (url) => {
        videoQueue.push(url);
        io.emit('update-queue', videoQueue);
        // Jika antrean tadinya kosong, langsung putar video pertama
        if(videoQueue.length === 1) {
            io.emit('play-video', { url: videoQueue[0] });
        }
    });

    socket.on('skip-video', () => {
        if(videoQueue.length > 0) {
            videoQueue.shift(); // Hapus video pertama (yang sedang diputar)
            io.emit('update-queue', videoQueue);
            if(videoQueue.length > 0) {
                io.emit('play-video', { url: videoQueue[0] });
            }
        }
    });

    socket.on('video-control', (data) => {
        socket.broadcast.emit('video-control', data);
    });

    socket.on('new-message', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.broadcast.emit('chat-receive', { ...data, color: user.color });
        }
    });

    socket.on('send-reaction', (emoji) => {
        io.emit('floating-reaction', emoji);
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const name = users[socket.id].name;
            delete users[socket.id];
            io.emit('update-users', Object.values(users));
            io.emit('system-log', `${name} meninggalkan pesta 🔴`);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVER WATCH PARTY READY ON PORT: ${PORT}`);
});
