const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

/* ===== SINGLE SOURCE OF TRUTH ===== */
const state = {
  videoUrl: "",
  time: 0,
  playing: false,
  lastUpdate: Date.now(),
  users: {} // socketId: { name, status }
};

io.on("connection", socket => {

  socket.on("join", name => {
    state.users[socket.id] = { name, status: "watching" };
    socket.emit("sync", state);
    io.emit("users", state.users);
  });

  socket.on("intent-play", () => {
    state.playing = true;
    state.lastUpdate = Date.now();
    io.emit("sync", state);
  });

  socket.on("intent-pause", () => {
    state.playing = false;
    state.lastUpdate = Date.now();
    io.emit("sync", state);
  });

  socket.on("intent-seek", time => {
    state.time = time;
    state.lastUpdate = Date.now();
    io.emit("sync", state);
  });

  socket.on("intent-set-video", url => {
    state.videoUrl = url;
    state.time = 0;
    state.playing = false;
    state.lastUpdate = Date.now();
    io.emit("sync", state);
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
server.listen(PORT, () =>
  console.log("WatchParty Final running on", PORT)
);