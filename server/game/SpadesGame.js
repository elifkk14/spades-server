class SpadesGame {
  constructor(players, io, roomCode, totalRounds = 3) {
    this.players = players.map(p => ({
      ...p,
      hand: [],
      bid: null,
      tricks: 0,
      score: 0
    }));
    this.io = io;
    this.roomCode = roomCode;
    this.currentPlayer = 0;
    this.gamePhase = 'bidding';
    this.trick = {};
    this.trickLeader = 0;
    this.leadSuit = null;
    this.trump = null;
    this.spadesBroken = false; // Bu değişkeni trumpBroken olarak kullanacağız
    this.round = 1;
    this.tricksPlayed = 0;
    this.totalRounds = totalRounds;
    this.dealerIndex = 0;
    this.gameEnded = false;
    this.winner = null;
    this.allPlayersPassed = false;
    this.bidWinner = null;
    
    this.suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
    this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    console.log(`SpadesGame created with ${totalRounds} rounds`);
  }

  createDeck() {
    const deck = [];
    this.suits.forEach(suit => {
      this.values.forEach(value => {
        deck.push({ suit, value, id: `${suit}_${value}` });
      });
    });
    return deck;
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getCardValue(card) {
    if (card.value === 'J') return 11;
    if (card.value === 'Q') return 12;
    if (card.value === 'K') return 13;
    if (card.value === 'A') return 14;
    return parseInt(card.value);
  }

  dealCards() {
    const deck = this.shuffleDeck(this.createDeck());
    
    for (let i = 0; i < 4; i++) {
      this.players[i].hand = deck.slice(i * 13, (i + 1) * 13);
      this.players[i].bid = null;
      this.players[i].tricks = 0;
    }
  }

  startNewRound() {
    console.log(`Starting new round ${this.round}/${this.totalRounds} for room ${this.roomCode}`);
    
    this.dealCards();
    this.gamePhase = 'bidding';
    this.currentPlayer = 0;
    this.trick = {};
    this.leadSuit = null;
    this.trump = null;
    this.bidWinner = null;
    this.spadesBroken = false; // Koz kırılma durumunu sıfırla
    this.tricksPlayed = 0;
    this.trickLeader = 0;
    this.allPlayersPassed = false;

    this.dealerIndex = (this.round - 1) % 4;
    console.log(`Dealer (zoruncu) for round ${this.round}: Player ${this.dealerIndex} (${this.players[this.dealerIndex].name})`);

    setTimeout(() => {
      this.broadcastGameState();
    }, 500);
  }

  determineBidWinner() {
    let highestBid = -1;
    let bidWinnerIndex = -1;
    
    this.players.forEach((player, index) => {
      if (player.bid !== -1 && player.bid > highestBid) {
        highestBid = player.bid;
        bidWinnerIndex = index;
      }
    });
    
    if (bidWinnerIndex === -1) {
      bidWinnerIndex = this.dealerIndex;
      this.players[this.dealerIndex].bid = 4;
      this.allPlayersPassed = true;
      console.log(`All players passed, dealer (${this.players[this.dealerIndex].name}) forced to bid 4`);
    }
    
    this.bidWinner = bidWinnerIndex;
    console.log(`Bid winner: Player ${bidWinnerIndex} (${this.players[bidWinnerIndex].name}) with bid ${this.players[bidWinnerIndex].bid}`);
    
    return bidWinnerIndex;
  }

  makeBid(socketId, bidValue) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1 || playerIndex !== this.currentPlayer || this.gamePhase !== 'bidding') {
      console.log('Invalid bid attempt:', { playerIndex, currentPlayer: this.currentPlayer, gamePhase: this.gamePhase });
      return;
    }

    console.log(`Player ${playerIndex} (${this.players[playerIndex].name}) made bid: ${bidValue}`);
    
    this.players[playerIndex].bid = bidValue;
    this.currentPlayer = (this.currentPlayer + 1) % 4;

    if (this.players.every(p => p.bid !== null)) {
      this.determineBidWinner();
      console.log('All players have bid, moving to trump selection');
      this.gamePhase = 'trumpSelection';
      this.currentPlayer = this.bidWinner;
    }

    this.broadcastGameState();
  }

  selectTrump(socketId, trumpSuit) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    
    if (playerIndex === -1 || playerIndex !== this.bidWinner || this.gamePhase !== 'trumpSelection') {
      console.log('Invalid trump selection attempt:', { 
        playerIndex, 
        bidWinner: this.bidWinner, 
        gamePhase: this.gamePhase 
      });
      return;
    }

    if (!this.suits.includes(trumpSuit)) {
      console.log('Invalid trump suit:', trumpSuit);
      return;
    }

    console.log(`Player ${playerIndex} (${this.players[playerIndex].name}) selected trump: ${trumpSuit}`);
    
    this.trump = trumpSuit;
    this.gamePhase = 'playing';
    this.currentPlayer = this.bidWinner;
    
    this.broadcastGameState();
  }

  // DÜZELTİLMİŞ canPlayCard fonksiyonu - Koz kuralları eklenmiş
  // DÜZELTİLMİŞ canPlayCard fonksiyonu - Zorunlu büyültme kuralı eklenmiş
canPlayCard(playerIndex, card) {
  const playerHand = this.players[playerIndex].hand;
  
  if (Object.keys(this.trick).length === 0) {
    // İlk kart oynanıyor
    if (card.suit === this.trump && !this.spadesBroken) {
      // Koz kırılmamışsa kozla başlanamaz
      // ANCAK: Eğer oyuncunun elinde sadece koz varsa, kozla başlayabilir
      const nonTrumpCards = playerHand.filter(c => c.suit !== this.trump);
      if (nonTrumpCards.length > 0) {
        console.log('Cannot lead with trump - trump not broken and player has non-trump cards');
        return false;
      }
    }
    return true;
  }

  // Başlatılan rengi takip etme kuralları
  const hasLeadSuit = playerHand.some(c => c.suit === this.leadSuit);
  
  if (hasLeadSuit) {
    // Açılan renkten varsa, o renkten atmak zorunda
    if (card.suit !== this.leadSuit) {
      console.log('Must follow lead suit when you have it');
      return false;
    }
    
    // *** YENİ: ZORUNLU BÜYÜLTME KURALI ***
    // Eğer elde koz yoksa (koz kırılmamışsa), zorunlu büyültme kuralı geçerli
    const trickHasTrump = Object.values(this.trick).some(c => c.suit === this.trump);
    
    if (!trickHasTrump) {
      // Elde koz yok, normal zorunlu büyültme kuralı geçerli
      const leadSuitCardsInHand = playerHand.filter(c => c.suit === this.leadSuit);
      const playedLeadSuitCards = Object.values(this.trick).filter(c => c.suit === this.leadSuit);
      
      if (playedLeadSuitCards.length > 0) {
        // Önceki en yüksek kartı bul
        const highestPlayedCard = playedLeadSuitCards.reduce((highest, current) => 
          this.getCardValue(current) > this.getCardValue(highest) ? current : highest
        );
        
        // Bu oyuncunun elindeki daha büyük kartları bul
        const higherCards = leadSuitCardsInHand.filter(c => 
          this.getCardValue(c) > this.getCardValue(highestPlayedCard)
        );
        
        // Eğer daha büyük kartı varsa ve oynadığı kart büyük değilse
        if (higherCards.length > 0 && this.getCardValue(card) <= this.getCardValue(highestPlayedCard)) {
          console.log(`Must play higher card - available: ${higherCards.map(c => c.value).join(',')}, played: ${card.value}, highest in trick: ${highestPlayedCard.value}`);
          return false;
        }
      }
    }
    // Eğer elde koz varsa, zorunlu büyültme kuralı geçersiz (istediği kartı oynayabilir)
    
  } else {
    // Açılan renkten yoksa
    const hasTrump = playerHand.some(c => c.suit === this.trump);
    
    if (hasTrump && card.suit !== this.trump) {
      // Elinde koz varsa ve koz atmıyorsa hata
      console.log('Must play trump when you dont have lead suit and have trump');
      return false;
    }
    
    if (card.suit === this.trump && hasTrump) {
      // Koz atıyorsa, büyültme kuralını kontrol et
      const currentTrumpInTrick = Object.values(this.trick).find(c => c.suit === this.trump);
      if (currentTrumpInTrick) {
        // Trick'te zaten koz var, büyültmek zorunda mı?
        const higherTrumps = playerHand.filter(c => 
          c.suit === this.trump && this.getCardValue(c) > this.getCardValue(currentTrumpInTrick)
        );
        
        if (higherTrumps.length > 0 && this.getCardValue(card) <= this.getCardValue(currentTrumpInTrick)) {
          console.log('Must play higher trump if available');
          return false;
        }
      }
    }
  }
  
  return true;
}

  playCard(socketId, card) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1 || playerIndex !== this.currentPlayer || this.gamePhase !== 'playing') {
      console.log('Invalid card play attempt:', { playerIndex, currentPlayer: this.currentPlayer, gamePhase: this.gamePhase });
      return;
    }

    if (!this.canPlayCard(playerIndex, card)) {
      console.log('Card play not allowed');
      return;
    }

    console.log(`Player ${playerIndex} played card: ${card.suit}_${card.value}`);

    this.players[playerIndex].hand = this.players[playerIndex].hand.filter(c => c.id !== card.id);
    this.trick[playerIndex] = card;

    // İlk kart mı?
    if (Object.keys(this.trick).length === 1) {
      this.leadSuit = card.suit;
    }

    // KOZ KIRILMA KONTROLÜ - Önemli değişiklik!
    if (card.suit === this.trump && this.leadSuit !== this.trump && !this.spadesBroken) {
      // Başka bir renkten başlatılmış olan ele koz atılmışsa, koz kırılmış olur
      this.spadesBroken = true;
      console.log(`TRUMP BROKEN! Player ${playerIndex} played trump on ${this.leadSuit} lead`);
    }

    if (Object.keys(this.trick).length === 4) {
      console.log('Trick completed, determining winner...');
      setTimeout(() => {
        this.completeTrick();
      }, 2000);
    } else {
      this.currentPlayer = (this.currentPlayer + 1) % 4;
    }

    this.broadcastGameState();
  }

  completeTrick() {
    const winner = this.determineTrickWinner(this.trick, this.leadSuit);
    this.players[winner].tricks++;
    
    console.log(`Trick won by player ${winner} (${this.players[winner].name})`);
    
    this.trick = {};
    this.leadSuit = null;
    this.trickLeader = winner;
    this.currentPlayer = winner;
    this.tricksPlayed++;

    if (this.players[0].hand.length === 0) {
      console.log('Round finished, calculating scores...');
      this.calculateScores();
      this.gamePhase = 'roundEnd';
    }

    this.broadcastGameState();
  }

  determineTrickWinner(currentTrick, leadSuit) {
    let winner = null;
    let winningCard = null;

    const trumpCards = Object.entries(currentTrick).filter(([_, card]) => card.suit === this.trump);
    
    if (trumpCards.length > 0) {
      trumpCards.forEach(([playerId, card]) => {
        if (!winningCard || this.getCardValue(card) > this.getCardValue(winningCard)) {
          winner = parseInt(playerId);
          winningCard = card;
        }
      });
    } else {
      Object.entries(currentTrick).forEach(([playerId, card]) => {
        if (card.suit === leadSuit) {
          if (!winningCard || this.getCardValue(card) > this.getCardValue(winningCard)) {
            winner = parseInt(playerId);
            winningCard = card;
          }
        }
      });
    }

    return winner;
  }

  calculateScores() {
    console.log('=== PUAN HESAPLAMA BAŞLADI ===');
    console.log(`İhale Kazanan: Player ${this.bidWinner} (${this.players[this.bidWinner].name})`);
    console.log(`İhale Değeri: ${this.players[this.bidWinner].bid}`);
    
    const bidValue = this.players[this.bidWinner].bid;
    
    this.players.forEach((player, index) => {
      const tricks = player.tricks;
      let roundScore = 0;
      
      console.log(`\n--- Player ${index} (${player.name}) ---`);
      console.log(`Aldığı el sayısı: ${tricks}`);
      
      if (index === this.bidWinner) {
        // İHALECİ PUANLAMASI
        if (tricks >= bidValue) {
          // İhaleyi tutturdu veya fazla aldı
          roundScore = (bidValue * 10) + (tricks - bidValue);
          console.log(`✅ İhaleyi tutturdu: (${bidValue} × 10) + ${tricks - bidValue} = ${roundScore}`);
        } else {
          // İhaleyi tutturamadı
          roundScore = -(bidValue * 10);
          console.log(`❌ İhaleyi tutturamadı: -(${bidValue} × 10) = ${roundScore}`);
        }
      } else {
        // DİĞER OYUNCULAR PUANLAMASI
        if (tricks === 0) {
          // Hiç el alamadı - ağır ceza
          roundScore = -(bidValue * 10);
          console.log(`💀 Hiç el alamadı: -(${bidValue} × 10) = ${roundScore}`);
        } else {
          // 1 veya daha fazla el aldı
          roundScore = tricks * 10;
          console.log(`✅ El aldı: ${tricks} × 10 = ${roundScore}`);
        }
      }
      
      player.score += roundScore;
      console.log(`Eski toplam: ${player.score - roundScore} → Yeni toplam: ${player.score}`);
    });
    
    console.log('\n=== ROUND SONU PUANLAR ===');
    this.players.forEach((player, index) => {
      console.log(`${player.name}: ${player.score} puan`);
    });
    console.log('=== PUAN HESAPLAMA BİTTİ ===\n');
  }
  
  nextRound() {
    if (this.round >= this.totalRounds) {
      console.log('All rounds completed, ending game...');
      this.endGame();
      return;
    }

    console.log('Starting next round...');
    this.round++;
    this.startNewRound();
  }

  endGame() {
    console.log('Game ended, determining winner...');
    this.gameEnded = true;
    
    const winner = this.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    this.winner = winner;
    console.log(`Game winner: ${winner.name} with ${winner.score} points`);
    
    this.broadcastGameState();
  }

  restartGame() {
    console.log(`Restarting game in room ${this.roomCode}`);
    
    this.players.forEach(player => {
      player.hand = [];
      player.bid = null;
      player.tricks = 0;
      player.score = 0;
    });
    
    this.currentPlayer = 0;
    this.gamePhase = 'bidding';
    this.trick = {};
    this.trickLeader = 0;
    this.leadSuit = null;
    this.trump = null;
    this.bidWinner = null;
    this.spadesBroken = false; // Koz kırılma durumunu sıfırla
    this.round = 1;
    this.tricksPlayed = 0;
    this.dealerIndex = 0;
    this.gameEnded = false;
    this.winner = null;
    this.allPlayersPassed = false;
    
    this.startNewRound();
  }

  broadcastGameState() {
    console.log(`Broadcasting game state - Phase: ${this.gamePhase}, Current Player: ${this.currentPlayer}, Room: ${this.roomCode}, Trump: ${this.trump}, Trump Broken: ${this.spadesBroken}`);
    
    this.players.forEach((player, index) => {
      const gameStateData = {
        players: this.players.map((p, i) => ({
          ...p,
          hand: i === index ? p.hand : Array(p.hand.length).fill(null)
        })),
        currentPlayer: this.currentPlayer,
        gamePhase: this.gamePhase,
        trick: this.trick,
        trump: this.trump,
        leadSuit: this.leadSuit,
        spadesBroken: this.spadesBroken, // Koz kırılma durumunu frontend'e gönder
        round: this.round,
        playerPosition: index,
        tricksPlayed: this.tricksPlayed,
        totalRounds: this.totalRounds,
        dealerIndex: this.dealerIndex,
        bidWinner: this.bidWinner,
        gameEnded: this.gameEnded,
        winner: this.winner,
        allPlayersPassed: this.allPlayersPassed
      };

      console.log(`Sending game state to player ${index} (${player.name}):`, {
        gamePhase: gameStateData.gamePhase,
        currentPlayer: gameStateData.currentPlayer,
        playerPosition: gameStateData.playerPosition,
        dealerIndex: gameStateData.dealerIndex,
        bidWinner: gameStateData.bidWinner,
        trump: gameStateData.trump,
        spadesBroken: gameStateData.spadesBroken,
        round: gameStateData.round,
        totalRounds: gameStateData.totalRounds
      });

      this.io.to(player.id).emit('gameState', gameStateData);
    });
  }
}

module.exports = SpadesGame;