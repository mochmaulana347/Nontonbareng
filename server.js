const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let sharedState = {
  videoUrl: "",
  currentTime: 0,
  playing: false
};

io.on("connection", (socket) => {
  console.log("connect:", socket.id);

  socket.on("join", ({ nickname }) => {
    if (!nickname) return;

    socket.nickname = nickname;

    // kirim state saat ini ke user baru
    socket.emit("sync-state", sharedState);

    io.emit("user-status", {
      id: socket.id,
      nickname,
      status: "watching"
    });
  });

  socket.on("set-video", (url) => {
    sharedState.videoUrl = url;
    sharedState.currentTime = 0;
    sharedState.playing = true;

    socket.broadcast.emit("set-video", url);
  });

  socket.on("play", (time) => {
    sharedState.playing = true;
    sharedState.currentTime = time;
    socket.broadcast.emit("play", time);
  });

  socket.on("pause", (time) => {
    sharedState.playing = false;
    sharedState.currentTime = time;
    socket.broadcast.emit("pause", time);
  });

  socket.on("disconnect", () => {
    if (!socket.nickname) return;
    io.emit("user-status", {
      id: socket.id,
      nickname: socket.nickname,
      status: "left"
    });
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("server running");
});