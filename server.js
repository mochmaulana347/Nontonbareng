const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('video-control', (data) => {
        socket.broadcast.emit('video-control', data);
    });
    socket.on('new-message', (data) => {
        socket.broadcast.emit('chat-receive', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server Ready: http://localhost:${PORT}`));
