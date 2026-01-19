const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let roomState = {
  vid: "dQw4w9WgXcQ",
  startedAt: null // timestamp server saat video dimulai
};

io.on("connection", (socket) => {
  // kirim state saat user baru join
  socket.emit("video-sync", roomState);

  socket.on("start-video", (data) => {
    roomState = {
      vid: data.vid,
      startedAt: Date.now() - data.time * 1000
    };
    io.emit("video-sync", roomState);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Watch Party running on port", PORT);
});