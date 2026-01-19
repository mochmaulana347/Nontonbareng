const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let state = {
  videoUrl: "",
  time: 0,
  playing: false
};

let users = {};

io.on("connection", socket => {

  socket.on("join", ({ nickname }) => {
    if (!nickname) return;

    users[socket.id] = {
      nickname,
      status: "watching"
    };

    socket.emit("sync", { state, users });
    io.emit("users", users);
  });

  socket.on("set-video", url => {
    state.videoUrl = url;
    state.time = 0;
    state.playing = true;
    io.emit("set-video", url);
  });

  socket.on("play", time => {
    state.playing = true;
    state.time = time;
    socket.broadcast.emit("play", time);
  });

  socket.on("pause", time => {
    state.playing = false;
    state.time = time;
    socket.broadcast.emit("pause", time);
  });

  socket.on("status", status => {
    if (users[socket.id]) {
      users[socket.id].status = status;
      io.emit("users", users);
    }
  });

  socket.on("chat", msg => {
    if (!users[socket.id]) return;
    io.emit("chat", {
      nickname: users[socket.id].nickname,
      msg
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
  });
});

server.listen(process.env.PORT || 3000);