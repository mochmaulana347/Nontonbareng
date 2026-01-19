const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const state = {
  videoUrl: "",
  playing: false,
  users: {} // socket.id -> {name, status}
};

io.on("connection", socket => {

  socket.on("join", name => {
    state.users[socket.id] = { name, status: "watching" };
    socket.emit("sync", state);
    io.emit("users", state.users);
  });

  socket.on("intent-set-video", url => {
    state.videoUrl = url;
    state.playing = false;
    io.emit("sync", state);
  });

  socket.on("intent-play", () => {
    state.playing = true;
    io.emit("sync", state);
  });

  socket.on("intent-pause", () => {
    state.playing = false;
    io.emit("sync", state);
  });

  socket.on("new-message", data => {
    io.emit("chat-receive", data);
  });

  socket.on("status", status => {
    if (state.users[socket.id]) {
      state.users[socket.id].status = status;
      io.emit("users", state.users);
    }
  });

  socket.on("disconnect", () => {
    delete state.users[socket.id];
    io.emit("users", state.users);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WatchParty ready on", PORT));