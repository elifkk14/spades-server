import React, { useState } from 'react';
import { Users, Plus, LogIn, Copy, Check, Target, Crown, Spade, Heart, Diamond, Club } from 'lucide-react';
import socket from '../utils/socket';

const GameLobby = ({ onGameStart, players = [], roomCode, isHost }) => {
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState(3);

  const roundOptions = [3, 5, 7, 9];

  

  const createRoom = () => {
    if (playerName.trim()) {
      socket.emit('createRoom', { 
        playerName: playerName.trim(),
        totalRounds: selectedRounds 
      });
    }
  };

  const joinRoom = () => {
    if (playerName.trim() && joinCode.trim()) {
      socket.emit('joinRoom', { 
        roomCode: joinCode.trim().toUpperCase(), 
        playerName: playerName.trim() 
      });
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    socket.emit('startGame');
  };

  // Floating card suits animation
  const FloatingCards = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-16 opacity-5 animate-float-slow">
        <Heart className="text-red-600" size={48} />
      </div>
      <div className="absolute top-40 right-20 opacity-5 animate-float-delayed">
        <Diamond className="text-red-600" size={36} />
      </div>
      <div className="absolute bottom-32 left-32 opacity-5 animate-float">
        <Club className="text-gray-800" size={40} />
      </div>
      <div className="absolute bottom-20 right-16 opacity-5 animate-float-slow">
        <Spade className="text-gray-800" size={44} />
      </div>
      <div className="absolute top-1/2 left-1/4 opacity-3 animate-float-delayed">
        <Heart className="text-red-600" size={24} />
      </div>
    </div>
  );

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 flex items-center justify-center p-4 relative">
        <FloatingCards />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent"></div>
        
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-green-900/10 max-w-md w-full border border-white/20">
          {/* Header with enhanced card theme */}
          <div className="text-center mb-8 relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1 text-lg opacity-60">
                <Heart className="text-red-500" size={16} />
                <Diamond className="text-red-500" size={16} />
                <Club className="text-gray-700" size={16} />
                <Spade className="text-gray-700" size={16} />
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mr-3">
                <Crown className="text-white" size={24} />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent tracking-tight">
                BATAK
              </h1>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg ml-3">
                <Spade className="text-white" size={20} />
              </div>
            </div>
            <p className="text-gray-600 font-semibold text-lg mb-2">Çok Oyunculu Kart Oyunu</p>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-blue-600 mx-auto rounded-full shadow-sm"></div>
          </div>

          <div className="space-y-6">
            {/* Enhanced player name input */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Oyuncu adınızı giriniz"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full p-5 bg-white/90 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-300 shadow-xl text-gray-800 font-semibold text-lg placeholder-gray-400"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="text-green-600" size={18} />
                  </div>
                </div>
              </div>
            </div>

            {!showJoinForm ? (
              <>
                {/* Enhanced round selection */}
                <div className="space-y-5">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Target className="text-white" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Tur Sayısını Seçin
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {roundOptions.map(rounds => (
                      <button
                        key={rounds}
                        onClick={() => setSelectedRounds(rounds)}
                        className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          selectedRounds === rounds
                            ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 text-green-800 shadow-xl shadow-green-200/50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50 bg-white/80 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        <div className="font-bold text-xl mb-1">{rounds} Tur</div>
                        <div className="text-sm text-gray-600">
                          {rounds * 13} El Oyun
                        </div>
                        {selectedRounds === rounds && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="text-white" size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enhanced create room button */}
                <button
                  onClick={createRoom}
                  disabled={!playerName.trim()}
                  className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white py-5 rounded-2xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="w-8 h-8 bg-white/20 rounded-2xl flex items-center justify-center mr-3">
                    <Plus size={18} />
                  </div>
                  Oyun Odası Oluştur ({selectedRounds} Tur)
                </button>
                
                {/* Enhanced join room button */}
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 rounded-2xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="w-8 h-8 bg-white/20 rounded-2xl flex items-center justify-center mr-3">
                    <LogIn size={18} />
                  </div>
                  Mevcut Odaya Katıl
                </button>
              </>
            ) : (
              <>
                {/* Enhanced join code input */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="6 haneli oda kodunu giriniz"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full p-5 bg-white/90 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300 shadow-xl text-gray-800 font-mono text-xl tracking-wider text-center"
                      maxLength={6}
                    />
                  </div>
                </div>
                
                {/* Enhanced join button */}
                <button
                  onClick={joinRoom}
                  disabled={!playerName.trim() || !joinCode.trim()}
                  className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Odaya Katıl
                </button>
                
                {/* Enhanced back button */}
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-5 rounded-2xl hover:from-gray-600 hover:to-gray-700 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Geri Dön
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced waiting room screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 flex items-center justify-center p-4 relative">
      <FloatingCards />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent"></div>
      
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-green-900/10 max-w-md w-full border border-white/20">
        {/* Enhanced header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mr-3">
              <Crown className="text-white" size={20} />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent tracking-tight">
              Oyun Odası
            </h2>
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg ml-3">
              <Spade className="text-white" size={16} />
            </div>
          </div>
          
          {/* Enhanced room code display */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 px-8 py-4 rounded-2xl border border-white/50 shadow-xl">
                <span className="text-3xl font-mono font-black text-gray-800 tracking-wider">
                  {roomCode || 'ABC123'}
                </span>
              </div>
            </div>
            <button
              onClick={copyRoomCode}
              className="group relative p-4 bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl"
              title="Kodu Kopyala"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {copied ? 
                <Check className="text-green-700 relative z-10" size={22} /> : 
                <Copy className="text-green-700 relative z-10" size={22} />
              }
            </button>
          </div>
          
          <p className="text-gray-600 font-semibold text-lg mb-3">
            Bu kodu arkadaşlarınızla paylaşın
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-green-600 to-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        {/* Enhanced players section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="text-white" size={18} />
              </div>
              <h3 className="font-black text-gray-800 text-xl">Oyuncular</h3>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-2xl shadow-lg">
              <Users size={16} className="text-gray-600" />
              <span className="font-bold text-gray-800">{players.length}/4</span>
            </div>
          </div>

          {/* Enhanced players list */}
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={player.id} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-green-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative flex items-center justify-between p-5 bg-white/90 rounded-2xl shadow-xl border border-white/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 
                      'bg-gradient-to-br from-blue-500 to-blue-700'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-800 text-lg">{player.name}</span>
                  </div>
                  {index === 0 && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 px-4 py-2 rounded-2xl font-bold shadow-lg">
                      <Crown size={16} />
                      Host
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Enhanced empty slots */}
            {Array(4 - players.length).fill(null).map((_, index) => (
              <div key={`empty-${index}`} className="relative">
                <div className="flex items-center justify-center p-5 bg-gradient-to-r from-gray-50/80 to-gray-100/80 rounded-2xl border-2 border-dashed border-gray-300 shadow-lg">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <span className="font-semibold text-lg">Oyuncu bekleniyor...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced start game button or waiting message */}
          {players.length === 4 && isHost ? (
            <button
              onClick={startGame}
              className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white py-6 rounded-2xl hover:from-green-700 hover:to-green-800 font-black text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-2xl">🎮</span>
                Oyunu Başlat
              </div>
            </button>
          ) : (
            <div className="text-center">
              <div className="relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 px-6 py-4 rounded-2xl border border-amber-200 shadow-lg">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-lg">
                  {players.length < 4 ? 'Oyunu başlatmak için 4 oyuncu gerekli' : 'Host oyunu başlatmasını bekliyor...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(8deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
};

export default GameLobby;