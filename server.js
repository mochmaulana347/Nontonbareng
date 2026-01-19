const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let roomState = {
  vid: "dQw4w9WgXcQ",
  time: 0,
  playing: false,
  lastUpdate: Date.now()
};

io.on("connection", socket => {
  socket.emit("init-state", roomState);

  socket.on("join-room", name => {
    socket.userName = name;
    socket.userState = "watching";
    updateUsers();
  });

  socket.on("video-command", data => {
    roomState = { ...roomState, ...data, lastUpdate: Date.now() };
    socket.broadcast.emit("video-sync", roomState);
  });

  socket.on("user-state", state => {
    socket.userState = state;
    updateUsers();
  });

  socket.on("chat-send", msg => {
    socket.broadcast.emit("chat-receive", {
      user: socket.userName,
      msg
    });
  });

  socket.on("disconnect", updateUsers);

  function updateUsers() {
    const users = [];
    for (let [, s] of io.sockets.sockets) {
      if (s.userName)
        users.push({ name: s.userName, state: s.userState });
    }
    io.emit("user-list", users);
  }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("Server ready on " + PORT));