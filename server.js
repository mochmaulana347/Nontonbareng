const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ===== STATE ===== */
let state = {
  video: null,
  time: 0,
  playing: false
};

let hostId = null;

/* ===== ROUTE ===== */
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

/* ===== SOCKET ===== */
io.on("connection", socket => {

  // tentukan host pertama
  if (!hostId) {
    hostId = socket.id;
    socket.emit("role", "host");
  } else {
    socket.emit("role", "viewer");
  }

  // kirim state ke user baru
  socket.emit("state", state);

  socket.on("load-video", url => {
    if (socket.id !== hostId) return;

    state.video = url;
    state.time = 0;
    state.playing = false;
    io.emit("state", state);
  });

  socket.on("play", time => {
    if (socket.id !== hostId) return;

    state.time = time;
    state.playing = true;
    io.emit("state", state);
  });

  socket.on("pause", time => {
    if (socket.id !== hostId) return;

    state.time = time;
    state.playing = false;
    io.emit("state", state);
  });

  socket.on("seek", time => {
    if (socket.id !== hostId) return;

    state.time = time;
    io.emit("state", state);
  });

  socket.on("disconnect", () => {
    if (socket.id === hostId) {
      hostId = null;
      state.playing = false;
    }
  });
});

server.listen(process.env.PORT || 3000);