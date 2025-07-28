import React, { useState, useEffect } from 'react';
import { Target, Crown, RotateCcw, AlertCircle, Users, Trophy } from 'lucide-react';
import Card from './Card';
import socket from '../utils/socket';

const SUITS = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠'
};

const SUIT_COLORS = {
  HEARTS: 'text-red-500',
  DIAMONDS: 'text-red-500',
  CLUBS: 'text-gray-800',
  SPADES: 'text-gray-800'
};

const SUIT_NAMES = {
  HEARTS: 'Kupa',
  DIAMONDS: 'Karo',
  CLUBS: 'Sinek',
  SPADES: 'Maça'
};

const PlayerArea = ({ player, position, isCurrentPlayer, onPlayCard, gamePhase, isMe, isDealer, isBidWinner }) => {
  const positionClasses = {
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    left: 'left-4 top-1/2 transform -translate-y-1/2',
    right: 'right-4 top-1/2 transform -translate-y-1/2'
  };

  const cardContainerClasses = {
    bottom: 'flex flex-row justify-center items-end',
    top: 'flex flex-row justify-center items-start',
    left: 'flex flex-col justify-center items-center',
    right: 'flex flex-col justify-center items-center'
  };

  const namePositions = {
    bottom: 'mt-3',
    top: 'mb-3',
    left: 'mt-2 writing-mode-vertical-rl text-orientation-mixed',
    right: 'mt-2 writing-mode-vertical-lr text-orientation-mixed'
  };

  const order = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const getCardSpacing = (index, total, position) => {
    if (position === 'left' || position === 'right') {
      return { marginTop: index > 0 ? '-50px' : '0' };
    }
    return { marginLeft: index > 0 ? '-16px' : '0' };
  };

  const isVertical = position === 'left' || position === 'right';

  return (
    <div className={`absolute ${positionClasses[position]} z-20`}>
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-col'} items-center`}>
        
        {/* Kartlar */}
        <div className={`${cardContainerClasses[position]} ${isVertical ? 'max-h-96' : 'overflow-x-visible max-w-full px-2'} overflow-visible`}>
          {isMe ? (
            <div className="flex gap-0">
              {[...(player.hand || [])]
                .sort((a, b) => {
                  if (a.suit === b.suit) {
                    return order.indexOf(a.value) - order.indexOf(b.value);
                  }
                  return a.suit.localeCompare(b.suit);
                })
                .map((card, idx) => (
                  <div key={card.id} style={getCardSpacing(idx, player.hand.length, position)}>
                    <Card
                      card={card}
                      onClick={() => isCurrentPlayer && gamePhase === 'playing' && onPlayCard(card)}
                      selectable={isCurrentPlayer && gamePhase === 'playing'}
                      playable={isCurrentPlayer && gamePhase === 'playing'}
                      small={false}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} gap-0`}>
              {Array(player.hand ? player.hand.length : 0).fill(null).map((_, idx) => (
                <div key={idx} style={getCardSpacing(idx, player.hand.length, position)} className="transition-all duration-300">
                  <Card
                    card={{ value: '', suit: '' }}
                    faceDown={true}
                    small={true}
                    className={`
                      ${position === 'top' ? 'rotate-180' : ''} 
                      ${position === 'left' ? 'rotate-90' : ''}
                      ${position === 'right' ? '-rotate-90' : ''}
                    `}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Oyuncu Adı ve Bilgileri - Artık en altta */}
        <div className={`${namePositions[position]} text-center z-30`}>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border">
            <div className={`font-bold text-xs ${isCurrentPlayer ? 'text-blue-600' : 'text-gray-700'} ${isMe ? 'text-green-600' : ''} flex items-center justify-center gap-1 ${isVertical ? 'flex-col' : ''}`}>
              <div className="flex items-center gap-1">
                {isDealer && <Crown className="text-yellow-500" size={12} />}
                {isBidWinner && <Target className="text-green-500" size={12} />}
              </div>
              <div>{player.name} {isMe && '(Sen)'}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              <div>İhale: <span className="font-semibold">{player.bid !== null ? (player.bid === -1 ? 'PAS' : player.bid) : '?'}</span></div>
              <div>Aldığı: <span className="font-semibold">{player.tricks || 0}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


// GameArea Bileşeni (değişiklik yok)
const GameArea = ({ trick, trump, players, playerPosition, justPlayedCard }) => {
  const getCardPositionInCenter = (relativePlayerIndex, totalPlayers = 4) => {
    const radius = 80; 
    const angle = (relativePlayerIndex * 2 * Math.PI) / totalPlayers + Math.PI / 2;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      transform: `translate(${x}px, ${y}px)`,
      zIndex: 20 + relativePlayerIndex
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Trump Display */}
      {trump && (
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border z-30">
          <div className="text-sm font-bold text-gray-700 mb-2">Koz</div>
          <div className={`text-3xl ${SUIT_COLORS[trump]} flex items-center justify-center`}>
            {SUITS[trump]}
          </div>
          <div className="text-xs text-gray-600 mt-1 text-center">{SUIT_NAMES[trump]}</div>
        </div>
      )}
      
      {/* Center Game Area */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-80 h-80 bg-green-700/15 border-4 border-green-400/30 rounded-full flex items-center justify-center">
          <div className="w-56 h-56 bg-green-600/10 rounded-full border-2 border-green-300/25 flex items-center justify-center">
            <div className="w-32 h-32 bg-green-500/5 rounded-full border border-green-200/20"></div>
          </div>
        </div>
      </div>
      
      {/* Trick Cards */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {Object.entries(trick || {}).map(([actualPlayerIndex, card]) => {
          if (!card) return null;
          
          const playerIdx = parseInt(actualPlayerIndex);
          const relativePosition = (playerIdx - playerPosition + 4) % 4;
          const cardPosition = getCardPositionInCenter(relativePosition);
          
          return (
            <div 
              key={`trick-card-${playerIdx}`} 
              className="absolute transition-all duration-500 ease-out"
              style={cardPosition}
            >
              <div className="transform -translate-x-1/2 -translate-y-1/2">
                <Card 
                  card={card} 
                  small={false}
                  className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/50" 
                />
              </div>
              
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3">
                <div className="w-3 h-3 bg-green-400 rounded-full opacity-70 animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrumpSelectionPanel = ({ isCurrentPlayer, onSelectTrump, bidWinnerName }) => {
  const trumpOptions = [
    { suit: 'HEARTS', name: 'Kupa', icon: '♥', color: 'text-red-500' },
    { suit: 'DIAMONDS', name: 'Karo', icon: '♦', color: 'text-red-500' },
    { suit: 'CLUBS', name: 'Sinek', icon: '♣', color: 'text-gray-800' },
    { suit: 'SPADES', name: 'Maça', icon: '♠', color: 'text-gray-800' }
  ];

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isCurrentPlayer ? 'Koz Takımını Seçin' : `${bidWinnerName} Koz Seçiyor...`}
        </h3>

        {isCurrentPlayer ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Target className="text-green-500" size={24} />
              <span className="text-lg text-gray-700">Hangi takımı koz yapıyorsunuz?</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {trumpOptions.map((trump) => (
                <button
                  key={trump.suit}
                  onClick={() => onSelectTrump(trump.suit)}
                  className="group flex flex-col items-center p-6 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <div className={`text-5xl ${trump.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {trump.icon}
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600">{trump.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Koz seçimi bekleniyor...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SpadesGame = ({ roomCode }) => {
  const [gameState, setGameState] = useState(null);
  const [currentBid, setCurrentBid] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [justPlayedCard, setJustPlayedCard] = useState(null);

  useEffect(() => {
    if (justPlayedCard) {
      const timer = setTimeout(() => {
        setJustPlayedCard(null);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [gameState, justPlayedCard]); 

  useEffect(() => {
    console.log('SpadesGame component mounted, setting up socket listeners');
    
    const handleGameState = (state) => {
      console.log('Game state received in SpadesGame:', state);
      setGameState(state);
      setIsLoading(false);
    };

    const handleError = (error) => {
      console.log('Game error:', error);
      setMessage(error);
      setIsLoading(false);
    };

    socket.on('gameState', handleGameState);
    socket.on('error', handleError);

    setTimeout(() => {
      if (!gameState) {
        console.log('No game state received, requesting...');
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      console.log('SpadesGame component unmounting, cleaning up listeners');
      socket.off('gameState', handleGameState);
      socket.off('error', handleError);
    };
  }, [justPlayedCard, gameState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-700 text-lg mb-2">Oyun yükleniyor...</p>
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <Users className="mr-2" size={16} />
              Oda: {roomCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-2xl">
          <div className="text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <p className="text-red-600 text-xl mb-4">Oyun durumu alınamadı!</p>
            <p className="text-sm text-gray-500 mb-6 flex items-center justify-center">
              <Users className="mr-2" size={16} />
              Oda: {roomCode}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <RotateCcw className="inline mr-2" size={16} />
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { 
    players = [], 
    currentPlayer = 0, 
    gamePhase = 'bidding', 
    trick = {}, 
    trump = null,
    round = 1, 
    playerPosition = 0,
    totalRounds = 3,
    dealerIndex = 0,
    gameEnded = false,
    winner = null,
    bidWinner = null
  } = gameState;
  
  if (!players.length || playerPosition >= players.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-2xl">
          <div className="text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <p className="text-red-600 text-xl mb-6">Oyuncu bilgileri alınamadı!</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <RotateCcw className="inline mr-2" size={16} />
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  //const currentPlayerData = players[playerPosition];
  const isCurrentPlayer = currentPlayer === playerPosition;
  //const isDealer = dealerIndex === playerPosition;
  const isBidWinner = bidWinner === playerPosition;

  const handleBidSubmit = () => {
    const bid = parseInt(currentBid) || 0;
    if (bid >= 4 && bid <= 13) {
      console.log('Making bid:', bid);
      socket.emit('makeBid', bid);
      setCurrentBid('');
    }
  };

  const handlePass = () => {
    console.log('Making pass bid');
    socket.emit('makeBid', -1);
    setCurrentBid('');
  };

  const handleSelectTrump = (trumpSuit) => {
    console.log('Selecting trump:', trumpSuit);
    socket.emit('selectTrump', trumpSuit);
  };

  const playCard = (card) => {
    console.log('Playing card:', card);
    socket.emit('playCard', card);
  };

  const nextRound = () => {
    console.log('Requesting next round');
    socket.emit('nextRound');
  };

  const restartGame = () => {
    console.log('Requesting restart game');
    socket.emit('restartGame');
  };

  // Game end screen
  if (gameEnded && winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-2xl max-w-lg w-full mx-4">
          <div className="text-center">
            <Trophy className="text-yellow-500 mx-auto mb-6" size={64} />
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              🎉 Oyun Bitti! 🎉
            </h2>
            <h3 className="text-2xl font-semibold text-green-600 mb-8">
              Kazanan: {winner.name}
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h4 className="font-bold text-lg mb-4 text-gray-700">Final Skorları</h4>
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className={`flex justify-between items-center py-3 px-2 rounded-lg mb-2 ${index === 0 ? 'bg-green-100 font-bold text-green-700' : 'bg-white'}`}>
                    <span className="flex items-center">
                      <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                        {index + 1}
                      </span>
                      {player.name}
                      {index === 0 && ' 👑'}
                    </span>
                    <span className="font-bold">{player.score} puan</span>
                  </div>
                ))}
            </div>

            <button
              onClick={restartGame}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl hover:from-green-700 hover:to-green-800 font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Yeni Oyun Başlat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Error Message */}
      {message && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl z-50 shadow-lg">
          {message}
          <button 
            onClick={() => setMessage('')}
            className="ml-3 text-red-200 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Room Info */}
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border z-30">
        <div className="flex items-center space-x-3">
          <Users className="text-blue-600" size={20} />
          <div>
            <div className="font-bold text-gray-800">Oda: {roomCode}</div>
            <div className="text-sm text-gray-600">Tur: {round}/{totalRounds}</div>
          </div>
        </div>
      </div>

      {/* Score Board */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border z-30">
        <h3 className="font-bold mb-3 text-gray-800 flex items-center">
          <Trophy className="text-yellow-500 mr-2" size={18} />
          Round {round}/{totalRounds} - Skorlar
        </h3>
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div key={player.id || idx} className={`flex justify-between items-center p-2 rounded-lg ${idx === playerPosition ? 'bg-green-100' : 'bg-gray-50'}`}>
              <span className={`text-sm flex items-center ${idx === playerPosition ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                {idx === dealerIndex && <Crown className="text-yellow-500 mr-1" size={14} />}
                {idx === bidWinner && <Target className="text-green-500 mr-1" size={14} />}
                {player.name}
              </span>
              <span className="ml-4 font-bold text-lg">{player.score || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bidding Panel */}
      {gamePhase === 'bidding' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {isCurrentPlayer ? 'İhalenizi Yapın' : `${players[currentPlayer]?.name || 'Oyuncu'} İhale Yapıyor...`}
            </h3>

            {isCurrentPlayer && currentPlayer === dealerIndex && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="text-yellow-600 mr-3" size={24} />
                  <div>
                    <p className="text-yellow-800 font-bold">Zoruncu Oyuncusunuz!</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Herkes pas derse otomatik 4 ihale yapacaksınız
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isCurrentPlayer ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3">
                  <Target className="text-blue-500" size={24} />
                  <span className="text-lg text-gray-700">Kaç el alacağınızı tahmin ediyorsunuz?</span>
                </div>

                <div className="flex flex-col space-y-4">
                  <input
                    type="number"
                    min="4"
                    max="13"
                    value={currentBid}
                    onChange={(e) => setCurrentBid(e.target.value)}
                    className="border-2 border-gray-300 rounded-xl px-4 py-3 w-32 text-center text-lg font-bold mx-auto focus:border-blue-500 focus:outline-none"
                    placeholder="4-13"
                    onKeyPress={(e) => e.key === 'Enter' && handleBidSubmit()}
                  />
                  <div className="flex space-x-4 justify-center">
                    <button
                      onClick={handleBidSubmit}
                      disabled={!currentBid || currentBid < 4 || currentBid > 13}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold transition-all duration-300 hover:shadow-lg"
                    >
                      İhale Yap
                    </button>
                    {currentPlayer !== dealerIndex && (
                      <button
                        onClick={handlePass}
                        className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 font-semibold transition-all duration-300 hover:shadow-lg"
                      >
                        Pas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">İhale bekleniyor...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trump Selection Panel */}
      {gamePhase === 'trumpSelection' && (
        <TrumpSelectionPanel
          isCurrentPlayer={isBidWinner}
          onSelectTrump={handleSelectTrump}
          bidWinnerName={bidWinner !== null ? players[bidWinner]?.name : ''}
        />
      )}

      {/* Round End Panel */}
      {gamePhase === 'roundEnd' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Round {round} Sonuçları</h3>
            <div className="space-y-3 mb-8">
              {players.map((player, idx) => (
                <div key={player.id || idx} className={`flex justify-between items-center p-3 rounded-lg ${idx === playerPosition ? 'bg-green-100' : 'bg-gray-50'}`}>
                  <span className={`flex items-center ${idx === playerPosition ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                    {idx === dealerIndex && <Crown className="text-yellow-500 mr-2" size={16} />}
                    {idx === bidWinner && <Target className="text-green-500 mr-2" size={16} />}
                    {player.name}
                  </span>
                  <span className="text-sm font-medium">
                    İhale: <span className="font-bold">{player.bid === -1 ? 'PAS' : player.bid}</span> | 
                    Aldığı: <span className="font-bold">{player.tricks}</span> | 
                    Skor: <span className="font-bold text-lg">{player.score}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={nextRound}
                className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {round >= totalRounds ? 'Oyunu Bitir' : 'Yeni Round'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      <GameArea 
        trick={trick} 
        trump={trump} 
        players={players} 
        playerPosition={playerPosition} 
        justPlayedCard={justPlayedCard} // ⭐ BUNU EKLE
      />

      {/* Players */}
      {players.map((player, idx) => {
        const positions = ['bottom', 'left', 'top', 'right'];
        const adjustedIndex = (idx - playerPosition + 4) % 4;
        
        return (
          <PlayerArea
            key={player.id || idx}
            player={player}
            position={positions[adjustedIndex]}
            isCurrentPlayer={currentPlayer === idx}
            onPlayCard={playCard}
            gamePhase={gamePhase}
            isMe={idx === playerPosition}
            isDealer={idx === dealerIndex}
            isBidWinner={idx === bidWinner}
          />
        );
      })}
    </div>
  );
};

export default SpadesGame;

