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
  startedAt: null, // timestamp ms
  pausedAt: null  // timestamp ms
};

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

io.on("connection", socket => {
  socket.emit("state", state);

  socket.on("load-video", url => {
    state.video = url;
    state.startedAt = null;
    state.pausedAt = null;
    io.emit("state", state);
  });

  socket.on("play", () => {
    if (!state.video) return;
    state.startedAt = Date.now();
    state.pausedAt = null;
    io.emit("state", state);
  });

  socket.on("pause", () => {
    if (!state.startedAt) return;
    state.pausedAt = Date.now();
    io.emit("state", state);
  });
});

server.listen(process.env.PORT || 3000);