const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('video-control', (data) => {
        socket.broadcast.emit('video-control', data);
    });
});

http.listen(process.env.PORT || 3000, () => console.log("Server Running..."));
