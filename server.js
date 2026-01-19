const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let roomState = {
  vid: "dQw4w9WgXcQ",
  startedAt: null
};

let users = {};

io.on("connection", (socket) => {
  socket.emit("video-sync", roomState);

  socket.on("join", (name) => {
    users[socket.id] = {
      name,
      watching: true
    };
    io.emit("users", users);
  });

  socket.on("visibility", (watching) => {
    if (users[socket.id]) {
      users[socket.id].watching = watching;
      io.emit("users", users);
    }
  });

  socket.on("chat", (msg) => {
    if (!users[socket.id]) return;
    io.emit("chat", {
      user: users[socket.id].name,
      msg
    });
  });

  socket.on("start-video", (data) => {
    roomState = {
      vid: data.vid,
      startedAt: Date.now()
    };
    io.emit("video-sync", roomState);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () =>
  console.log("Watch Party running on", PORT)
);