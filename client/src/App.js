import React, { useState, useEffect } from 'react';
import GameLobby from './components/GameLobby';
import SpadesGame from './components/SpadesGame';
import socket from './utils/socket';

function App() {
  const [gameState, setGameState] = useState('lobby'); // 'lobby', 'waiting', 'starting', 'playing'
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Socket bağlantı durumunu kontrol et
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setGameState('lobby');
      setRoomCode('');
      setPlayers([]);
      setCurrentPlayer(null);
      setIsHost(false);
      setError('Sunucu bağlantısı kesildi');
    });

    // Oda oluşturulduğunda
    socket.on('roomCreated', (data) => {
      console.log('Room created:', data);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setCurrentPlayer(data.player);
      setGameState('waiting');
      setIsHost(true);
      setError('');
    });

    // Odaya katılıldığında
    socket.on('roomJoined', (data) => {
      console.log('Room joined:', data);
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setCurrentPlayer(data.player);
      setGameState('waiting');
      setIsHost(false);
      setError('');
    });

    // Yeni oyuncu katıldığında
    socket.on('playerJoined', (data) => {
      console.log('Player joined:', data);
      setPlayers(data.players);
    });

    // Oyuncu ayrıldığında
    socket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      setPlayers(data.players);
    });

    // Oyun başlıyor bildirimi
    socket.on("gameStarting", (data) => {
      console.log("Game starting:", data);
      setGameState("playing");  // HEMEN OYUNU BAŞLAT
    });
    // Oyun durumu güncellemesi
    socket.on('gameState', (data) => {
      console.log('Game state received in App:', {
        gamePhase: data.gamePhase,
        currentPlayer: data.currentPlayer,
        playerPosition: data.playerPosition
      });
      
      // Eğer hala starting veya waiting state'indeyse playing'e geç
      if (gameState === 'starting' || gameState === 'waiting') {
        setGameState('playing');
      }
    });

    // Hata durumları
    socket.on('error', (errorMessage) => {
      console.error('Socket error:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarting');
      socket.off('gameState');
      socket.off('error');
    };
  }, [gameState]);

  const resetGame = () => {
    setGameState('lobby');
    setRoomCode('');
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setError('');
  };

  // Oyun başlıyor ekranı
  if (gameState === 'starting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oyun Başlıyor...</h2>
          <p className="text-gray-600">Kartlar dağıtılıyor...</p>
          <p className="text-sm text-gray-500 mt-2">Oda: {roomCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-4 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {(gameState === 'lobby' || gameState === 'waiting') && (
        <GameLobby 
          onGameStart={() => setGameState('playing')}
          players={players}
          roomCode={roomCode}
          isHost={isHost}
        />
      )}

      {gameState === 'playing' && (
        <SpadesGame 
          roomCode={roomCode}
          onGameEnd={resetGame}
        />
      )}
    </div>
  );
}

export default App;