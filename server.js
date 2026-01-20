const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Folder public agar file index.html bisa diakses
app.use(express.static(__dirname));

let users = {};

io.on('connection', (socket) => {
    
    // 1. Logika saat user bergabung
    socket.on('join', (name) => {
        // Simpan data user
        users[socket.id] = { 
            name, 
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            status: 'active' 
        };
        
        // Update daftar orang online ke semua user
        io.emit('update-users', Object.values(users));
        
        // KIRIM LOG: Memberitahu semua orang ada yang masuk
        io.emit('system-log', `${name} bergabung ke pesta 🟢`);
    });

    // 2. Logika Presence (Deteksi fokus tab: LED Hijau/Abu-abu)
    socket.on('presence-change', (status) => {
        if(users[socket.id]) {
            users[socket.id].status = status;
            io.emit('update-users', Object.values(users));
        }
    });

    // 3. Logika Sinkronisasi Video (Play, Pause, Load)
    socket.on('video-control', (data) => {
        // Mengirim perintah ke semua orang kecuali pengirim
        socket.broadcast.emit('video-control', data);
    });

    // 4. Logika Chat & Voice Note
    socket.on('new-message', (data) => {
        const user = users[socket.id];
        if (user) {
            socket.broadcast.emit('chat-receive', { 
                ...data, 
                color: user.color 
            });
        }
    });

    // 5. Logika Live Reaction (Emoji Terbang)
    socket.on('send-reaction', (emoji) => {
        io.emit('floating-reaction', emoji);
    });

    // 6. Logika saat user keluar (Disconnect)
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const name = users[socket.id].name;
            delete users[socket.id];
            
            // Update daftar online
            io.emit('update-users', Object.values(users));
            
            // KIRIM LOG: Memberitahu semua orang ada yang keluar
            io.emit('system-log', `${name} meninggalkan pesta 🔴`);
        }
    });
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================`);
    console.log(`SERVER WATCH PARTY READY!`);
    console.log(`Running on port: ${PORT}`);
    console.log(`====================================`);
});
