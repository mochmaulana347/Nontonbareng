const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ================= HTML ================= */
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Nobar Online (Single)</title>
  <style>
    body {
      background:#0f172a;
      color:white;
      font-family:Arial;
      padding:20px;
    }
    input, button {
      padding:8px;
      width:420px;
      max-width:100%;
      margin:5px 0;
    }
    button {
      cursor:pointer;
    }
    video {
      max-width:100%;
      margin-top:15px;
    }
  </style>
</head>
<body>

<h2>🎬 Nobar Online (Single Room)</h2>

<input id="url" placeholder="Paste link YouTube / MP4 online">
<br>
<button onclick="loadVideo()">Load Video</button>

<div id="player">
  <video id="video" controls style="display:none"></video>
  <div id="yt"></div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script src="https://www.youtube.com/iframe_api"></script>

<script>
const socket = io();
const video = document.getElementById("video");
const ytDiv = document.getElementById("yt");
let ytPlayer = null;

/* ===== Utils ===== */
function isYoutube(url) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYoutubeId(url) {
  const match = url.match(/(?:v=|\\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

/* ===== Load Video ===== */
function loadVideo() {
  const url = document.getElementById("url").value;
  socket.emit("load-video", url);
  applyVideo(url);
}

function applyVideo(url) {

  if (isYoutube(url)) {
    video.style.display = "none";
    ytDiv.innerHTML = '<div id="ytplayer"></div>';

    ytPlayer = new YT.Player("ytplayer", {
      videoId: getYoutubeId(url),
      events: {
        onStateChange: (e) => {
          if (e.data === 1)
            socket.emit("play", ytPlayer.getCurrentTime());
          if (e.data === 2)
            socket.emit("pause", ytPlayer.getCurrentTime());
        }
      }
    });

  } else {
    ytDiv.innerHTML = "";
    video.style.display = "block";
    video.src = url;
    video.load();
  }
}

/* ===== HTML5 Sync ===== */
video.onplay = () =>
  socket.emit("play", video.currentTime);

video.onpause = () =>
  socket.emit("pause", video.currentTime);

video.onseeked = () =>
  socket.emit("seek", video.currentTime);

/* ===== Receive Sync ===== */
socket.on("load-video", applyVideo);

socket.on("play", t => {
  video.currentTime = t;
  video.play();
});

socket.on("pause", t => {
  video.currentTime = t;
  video.pause();
});

socket.on("seek", t => {
  video.currentTime = t;
});
</script>

</body>
</html>
`;

/* ================= SERVER ================= */
app.get("/", (_, res) => res.send(html));

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