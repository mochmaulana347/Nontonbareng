const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Server menyimpan status terakhir untuk orang yang baru join
let roomState = {
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', // Default video
    time: 0,
    playing: false,
    updatedAt: Date.now()
};

io.on('connection', (socket) => {
    
    // Saat ada orang baru masuk (Initial Sync)
    socket.on('join-room', () => {
        let now = Date.now();
        let estimatedTime = roomState.time;
        
        // Jika video sedang jalan, hitung selisih waktu agar sinkron
        if (roomState.playing) {
            estimatedTime += (now - roomState.updatedAt) / 1000;
        }

        socket.emit('video-command', {
            action: 'initial-sync',
            url: roomState.url,
