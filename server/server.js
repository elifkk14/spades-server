const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./game/GameRoom');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Oyun odaları
const gameRooms = new Map();

io.on('connection', (socket) => {
  console.log('Yeni oyuncu bağlandı:', socket.id);

  // Oyun odası oluştur - tur sayısı ile birlikte
  socket.on('createRoom', (data) => {
    const { playerName, totalRounds = 3 } = data;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRoom = new GameRoom(roomCode, io);
    
    // Tur sayısını ayarla
    gameRoom.setTotalRounds(totalRounds);
    gameRooms.set(roomCode, gameRoom);
    
    const player = gameRoom.addPlayer(socket.id, playerName);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    console.log(`Room created: ${roomCode} by ${playerName} with ${totalRounds} rounds`);
    socket.emit('roomCreated', { 
      roomCode, 
      player, 
      players: gameRoom.getPlayers(),
      totalRounds: totalRounds
    });
  });

  // Oyun odasına katıl
  socket.on('joinRoom', (data) => {
    const { roomCode, playerName } = data;
    const gameRoom = gameRooms.get(roomCode);
    
    if (!gameRoom) {
      console.log(`Room not found: ${roomCode}`);
      socket.emit('error', 'Oyun odası bulunamadı!');
      return;
    }
    
    if (gameRoom.getPlayers().length >= 4) {
      console.log(`Room full: ${roomCode}`);
      socket.emit('error', 'Oyun odası dolu!');
      return;
    }
    
    const player = gameRoom.addPlayer(socket.id, playerName);
    if (!player) {
      socket.emit('error', 'Oyuna katılınamadı!');
      return;
    }
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    console.log(`Player ${playerName} joined room ${roomCode}. Total players: ${gameRoom.getPlayers().length}`);
    
    socket.emit('roomJoined', { 
      roomCode, 
      player, 
      players: gameRoom.getPlayers(),
      totalRounds: gameRoom.totalRounds
    });
    socket.to(roomCode).emit('playerJoined', { 
      player, 
      players: gameRoom.getPlayers(),
      totalRounds: gameRoom.totalRounds
    });
    
    // 4 oyuncu varsa oyunu başlat
    if (gameRoom.getPlayers().length === 4) {
      console.log(`Room ${roomCode} is full, starting game automatically`);
      setTimeout(() => {
        gameRoom.startGame();
      }, 1000);
    }
  });

  // Oyunu manuel olarak başlat
  socket.on('startGame', () => {
    console.log(`Manual game start requested by ${socket.id} in room ${socket.roomCode}`);
    const gameRoom = gameRooms.get(socket.roomCode);
    if (gameRoom && gameRoom.getPlayers().length === 4) {
      gameRoom.startGame();
    } else {
      console.log('Cannot start game - not enough players or room not found');
      socket.emit('error', 'Oyun başlatılamadı - yeterli oyuncu yok');
    }
  });

  // İhale yap
  socket.on('makeBid', (bid) => {
    console.log(`Bid received: ${bid} from ${socket.id} in room ${socket.roomCode}`);
    const gameRoom = gameRooms.get(socket.roomCode);
    if (gameRoom) {
      gameRoom.makeBid(socket.id, bid);
    } else {
      console.log('No game room found for bid');
    }
  });

  // Koz seçimi
socket.on('selectTrump', (trumpSuit) => {
    console.log(`Trump selection received: ${trumpSuit} from ${socket.id} in room ${socket.roomCode}`);
    const gameRoom = gameRooms.get(socket.roomCode);
    if (gameRoom && typeof gameRoom.selectTrump === 'function') {
      gameRoom.selectTrump(socket.id, trumpSuit);
    } else {
      console.log('No game room found or selectTrump not implemented');
      socket.emit('error', 'Koz seçilemedi!');
    }
  });

  // Kart oyna
  socket.on('playCard', (card) => {
    console.log(`Card played: ${card.suit}_${card.value} from ${socket.id} in room ${socket.roomCode}`);
    const gameRoom = gameRooms.get(socket.roomCode);
    if (gameRoom) {
      gameRoom.playCard(socket.id, card);
    } else {
      console.log('No game room found for card play');
    }
  });

  // Yeni round başlat
  socket.on('nextRound', () => {
    console.log(`Next round requested by ${socket.id} in room ${socket.roomCode}`);
    const gameRoom = gameRooms.get(socket.roomCode);
    if (gameRoom) {
      gameRoom.nextRound();
    } else {
      console.log('No game room found for next round');
    }
  });

  // Oyunu yeniden başlat
  socket.on('restartGame', () => {
    console.log(`Restart game requested by ${socket.id} in room ${socket.roomCode}`);
    const gameRoom = gameRooms.get(socket.roomCode);
    if (gameRoom) {
      gameRoom.restartGame();
    } else {
      console.log('No game room found for restart');
    }
  });

  
  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı:', socket.id);
    
    if (socket.roomCode) {
      const gameRoom = gameRooms.get(socket.roomCode);
      if (gameRoom) {
        gameRoom.removePlayer(socket.id);
        socket.to(socket.roomCode).emit('playerLeft', { 
          players: gameRoom.getPlayers() 
        });
        
        // Oda boşsa sil
        if (gameRoom.getPlayers().length === 0) {
          gameRooms.delete(socket.roomCode);
          console.log(`Oyun odası silindi: ${socket.roomCode}`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});

// Hata yakalama
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});