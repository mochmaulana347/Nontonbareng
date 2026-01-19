const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ====== GLOBAL STATE ====== */
let currentVideo = null;
let currentTime = 0;
let isPlaying = false;

/* ================= HTML ================= */
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Nobar Online</title>
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
    video { max-width:100%; margin-top:15px }
  </style>
</head>
<body>

<h2>🎬 Nobar Online (Stable)</h2>

<input id="url" placeholder="Paste YouTube / MP4 online">
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

/* ===== FLAG ANTI LOOP ===== */
let syncing = false;

/* ===== Utils ===== */
function isYoutube(url) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYoutubeId(url) {
  const m = url.match(/(?:v=|\\/)([0-9A-Za-z_-]{11})/);
  return m ? m[1] : null;
}

/* ===== Load ===== */
function loadVideo() {
  const url = document.getElementById("url").value;
  socket.emit("load-video", url);
}

/* ===== Apply ===== */
function applyVideo(url, time = 0, play = false) {
  syncing = true;

  if (isYoutube(url)) {
    video.style.display = "none";
    ytDiv.innerHTML = '<div id="ytplayer"></div>';

    ytPlayer = new YT.Player("ytplayer", {
      videoId: getYoutubeId(url),
      events: {
        onReady: () => {
          ytPlayer.seekTo(time, true);
          if (play) ytPlayer.playVideo();
        },
        onStateChange: (e) => {
          if (syncing) return;
          if (e.data === 1)
            socket.emit("play", ytPlayer.getCurrentTime());
          if (e.data === 2)
            socket.emit("pause", ytPlayer.getCurrentTime());
        }
      }
    });

  } else {
    ytDiv.innerHTML = "";