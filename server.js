const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {

  socket.on("load-video", (url) => {
    socket.broadcast.emit("load-video", url);
  });

  socket.on("play", (time) => {
    socket.broadcast.emit("play", time);
  });

  socket.on("pause", (time) => {
    socket.broadcast.emit("pause", time);
  });

  socket.on("seek", (time) => {
    socket.broadcast.emit("seek", time);
  });

});

server.listen(process.env.PORT || 3000);