const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let roomState = {
  src: "",
  time: 0,
  playing: false
};

io.on("connection", socket => {
  socket.emit("init", roomState);

  socket.on("join", name => {
    socket.name = name;
    socket.state = "watching";
    update();
  });

  socket.on("video", data => {
    roomState = { ...roomState, ...data };
    socket.broadcast.emit("sync", roomState);
  });

  socket.on("state", s => {
    socket.state = s;
    update();
  });

  socket.on("chat", msg => {
    socket.broadcast.emit("chat", { user: socket.name, msg });
  });

  socket.on("disconnect", update);

  function update() {
    const users = [];
    for (let [, s] of io.sockets.sockets) {
      if (s.name) users.push({ name: s.name, state: s.state });
    }
    io.emit("users", users);
  }
});

http.listen(process.env.PORT || 3000, () =>
  console.log("Server ready")
);