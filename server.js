const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ===== GLOBAL STATE ===== */
let currentVideo = null;
let currentTime = 0;
let isPlaying = false;

/* ===== SERVE INDEX ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ===== SOCKET ===== */
io.on("connection", socket => {

  // kirim state ke user baru
  socket.emit("state", {
    video: currentVideo,
    time: currentTime,
    playing: isPlaying
  });

  socket.on("load-video", url => {
    currentVideo = url;
    currentTime = 0;
    isPlaying = false;
    socket.broadcast.emit("load-video", url);
  });

  socket.on("play", time => {
    currentTime = time;
    isPlaying = true;
    socket.broadcast.emit("play", time);
  });

  socket.on("pause", time => {
    currentTime = time;
    isPlaying = false;
    socket.broadcast.emit("pause", time);
  });

  socket.on("seek", time => {
    currentTime = time;
    socket.broadcast.emit("seek", time);
  });
});

server.listen(process.env.PORT || 3000);