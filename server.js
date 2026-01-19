const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Memory Server untuk menyimpan posisi video terakhir
let roomState = {
    url: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    currentTime: 0,
    playing: false,
    lastUpdated: Date.now()
};

io.on('connection', (socket) => {
    
    // 1. Logika Orang Baru Join (Initial Sync)
    socket.on('join-room', () => {
        // Hitung estimasi waktu sekarang berdasarkan durasi sejak update terakhir
        let estimatedTime = roomState.currentTime;
        if (roomState.playing) {
            const delta = (Date.now() - roomState.lastUpdated) / 1000;
            estimatedTime += delta;
        }

        // Kirimkan ke user yang baru join saja
        socket.emit('video-command', {
            action: 'sync-join',
            url: roomState.url,
            time: estimatedTime,
            playing: roomState.playing
        });
    });

    // 2. Logika Estafet (Siapa klik, dia jadi patokan)
    socket.on('video-command', (data) => {
        // Simpan perubahan ke memory server
        roomState.url = data.url || roomState.url;
        roomState.currentTime = data.time;
        roomState.playing = (data.action === 'play');
        roomState.lastUpdated = Date.now();

        // Sebarkan ke semua orang KECUALI pengirim (Broadcast)
        socket.broadcast.emit('video-command', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server Estafet aktif di port ${PORT}`));

