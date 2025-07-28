const SpadesGame = require('./SpadesGame');

class GameRoom {
  constructor(roomCode, io) {
    this.roomCode = roomCode;
    this.io = io;
    this.players = [];
    this.game = null;
    this.gameStarted = false;
    this.totalRounds = 3; // Varsayılan tur sayısı
  }

  addPlayer(socketId, playerName) {
    if (this.players.length >= 4) {
      return null;
    }

    const player = {
      id: socketId,
      name: playerName,
      position: this.players.length,
      ready: false,
      connected: true
    };

    this.players.push(player);
    console.log(`Player ${playerName} (${socketId}) added to room ${this.roomCode}. Total players: ${this.players.length}`);
    return player;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.id === socketId);
    if (index !== -1) {
      this.players[index].connected = false;
      console.log(`Player ${this.players[index].name} disconnected from room ${this.roomCode}`);
    }
  }

  getPlayers() {
    return this.players;
  }

  // Tur sayısını belirleme
  setTotalRounds(rounds) {
    this.totalRounds = rounds;
    console.log(`Room ${this.roomCode} total rounds set to: ${rounds}`);
  }

  startGame() {
    if (this.players.length !== 4 || this.gameStarted) {
      console.log(`Cannot start game - Players: ${this.players.length}, Already started: ${this.gameStarted}`);
      return;
    }

    console.log(`Starting game in room ${this.roomCode} with 4 players, ${this.totalRounds} rounds`);
    this.gameStarted = true;
        
    // Oyuncuları oyuna bildirle
    this.io.to(this.roomCode).emit('gameStarting', {
      message: 'Oyun başlıyor...',
      players: this.players,
      totalRounds: this.totalRounds
    });

    // Game instance'ını oluştur - tur sayısını da gönder
    this.game = new SpadesGame(this.players, this.io, this.roomCode, this.totalRounds);
        
    // Kısa bir süre sonra oyunu başlat
    setTimeout(() => {
      console.log('Initializing new round...');
      this.game.startNewRound();
    }, 1000);
  }

  makeBid(socketId, bid) {
    if (this.game) {
      this.game.makeBid(socketId, bid);
    } else {
      console.log('No active game to make bid');
    }
  }

  playCard(socketId, card) {
    if (this.game) {
      this.game.playCard(socketId, card);
    } else {
      console.log('No active game to play card');
    }
  }

  selectTrump(socketId, trumpSuit) {
    if (this.game) {
      this.game.selectTrump(socketId, trumpSuit);
    } else {
      console.log('No active game to select trump');
    }
  }


  nextRound() {
    if (this.game) {
      this.game.nextRound();
    } else {
      console.log('No active game to start next round');
    }
  }

  restartGame() {
    if (this.game) {
      this.game.restartGame();
    } else {
      console.log('No active game to restart');
    }
  }
}

module.exports = GameRoom;