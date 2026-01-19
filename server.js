const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let roomState = {
  src: "",
  time: 0,
  playing: false,
  updatedAt: Date.now()
};

let users = {};

io.on("connection", socket => {

  socket.on("join", name => {
    users[socket.id] = { name, status: "idle" };
    socket.emit("init-state", roomState);
    io.emit("users", users);
  });

  socket.on("video-action", data => {
    // ⛔ cegah spam state lama
    if (Date.now() - roomState.updatedAt < 300) return;

    roomState = {
      src: data.src ?? roomState.src,
      time: data.time ?? roomState.time,
      playing: data.playing ?? roomState.playing,
      updatedAt: Date.now()
    };

    socket.broadcast.emit("sync", roomState);
  });

  socket.on("user-status", status => {
    if (users[socket.id]) {
      users[socket.id].status = status;
      io.emit("users", users);
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log("Nobar server ready")
);