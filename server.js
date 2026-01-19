const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let users = {}; // Untuk menyimpan data { socketId: username }

io.on('connection', (socket) => {
    
    socket.on('join-room', (username) => {
        users[socket.id] = username;
        // Beritahu semua orang ada yang join
        io.emit('sys-log', `${username} baru saja bergabung!`);
        // Update daftar user di semua layar
        io.emit('update-users', Object.values(users));
    });

    socket.on('video-control', (data) => {
        socket.broadcast.emit('video-control', data);
    });

    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', {
            user: users[socket.id] || "Anonim",
            msg: msg
        });
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('sys-log', `${users[socket.id]} keluar dari room.`);
            delete users[socket.id];
            io.emit('update-users', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server berjalan di port ' + PORT);
});
