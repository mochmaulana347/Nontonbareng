const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let roomState = {
    url: '',
    time: 0,
    playing: false,
    lastUpdate: Date.now()
};

io.on('connection', (socket) => {
    // Kirim data saat ini ke penghuni baru
    const currentElapsed = roomState.playing ? (Date.now() - roomState.lastUpdate) / 1000 : 0;
    socket.emit('sync-all', {
        url: roomState.url,
        time: roomState.time + currentElapsed,
        playing: roomState.playing
    });

    socket.on('video-action', (data) => {
        // Update state di server
        roomState.url = data.url || roomState.url;
        roomState.time = data.time;
        roomState.playing = (data.action === 'play');
        roomState.lastUpdate = Date.now();

        // Broadcast ke orang lain (KECUALI pengirim)
        socket.broadcast.emit('video-action', data);
    });
});

http.listen(process.env.PORT || 3000);
