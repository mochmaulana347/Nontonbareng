const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // Sinyal kontrol video (Play, Pause, Change)
    socket.on('video-control', (data) => {
        socket.broadcast.emit('video-control', data);
    });

    // Sinyal Chat
    socket.on('new-message', (msg) => {
        socket.broadcast.emit('chat-receive', msg);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server aktif di port ${PORT}`));
