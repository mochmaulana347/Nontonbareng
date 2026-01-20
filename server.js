const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const state = {
  videoUrl: "",
  playing: false,
  time: 0,
  hostId: null,
  users: {} // socket.id -> {name, status}
};

// Sync interval (server authoritative)
setInterval(()=>{
  if(state.hostId){
    io.emit("sync", state);
  }
}, 500);

io.on("connection", socket => {

  socket.on("join", name=>{
    state.users[socket.id] = { name, status:"watching" };
    if(!state.hostId) state.hostId = socket.id; // user pertama jadi host
    socket.emit("sync", state);
    io.emit("users", state.users);
  });

  socket.on("intent-set-video", url=>{
    if(socket.id!==state.hostId) return; // cuma host
    state.videoUrl = url;
    state.time = 0;
    state.playing = false;
  });

  socket.on("intent-play", ()=>{
    if(socket.id!==state.hostId) return;
    state.playing = true;
  });

  socket.on("intent-pause", ()=>{
    if(socket.id!==state.hostId) return;
    state.playing = false;
  });

  socket.on("intent-seek", time=>{
    if(socket.id!==state.hostId) return;
    state.time = time;
  });

  socket.on("status", status=>{
    if(state.users[socket.id]){
      state.users[socket.id].status = status;
      io.emit("users", state.users);
    }
  });

  socket.on("new-message", data=>{
    io.emit("chat-receive", data);
  });

  socket.on("disconnect", ()=>{
    if(socket.id===state.hostId) state.hostId = Object.keys(state.users)[0]||null;
    delete state.users[socket.id];
    io.emit("users", state.users);
  });

});

const PORT = process.env.PORT||3000;
server.listen(PORT, ()=>console.log("WatchParty host ready on port",PORT));