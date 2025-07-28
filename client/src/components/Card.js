import React from 'react';

const SUITS = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠'
};

const SUIT_COLORS = {
  HEARTS: 'text-red-600',
  DIAMONDS: 'text-red-600',
  CLUBS: 'text-black',
  SPADES: 'text-black'
};

const CARD_VALUES = {
  'A': 'A',
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  '8': '8', '9': '9', '10': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K'
};

const Card = ({ card, onClick, selectable = false, small = false, faceDown = false, className = '' }) => {
  const baseSize = small ? 'w-14 h-20' : 'w-24 h-36';
  const fontSize = small ? 'text-xs' : 'text-sm';
  const suitSize = small ? 'text-base' : 'text-2xl';
  const cornerSize = small ? 'text-xs' : 'text-sm';

  // 🎴 Arka yüz (faceDown) tasarımı
  if (faceDown) {
    return (
      <div
        className={`
          ${baseSize}
          bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950
          border-2 border-gray-300 rounded-lg
          flex items-center justify-center
          cursor-pointer shadow-md transition-transform duration-300
          ${selectable ? 'hover:-translate-y-1 hover:shadow-xl' : ''}
          relative overflow-hidden
          ${className}
        `}
        onClick={onClick}
      >
        <div className="absolute inset-1.5 border border-blue-500 rounded opacity-40"></div>
        <div className="absolute inset-3 border border-blue-400 rounded opacity-30"></div>
        <div className="text-blue-300 text-2xl opacity-60">♠</div>
      </div>
    );
  }

  // 🃏 Ön yüz tasarımı
  const cardClass = `
    ${baseSize}
    bg-gradient-to-br from-white via-gray-50 to-gray-100 
    border-2 border-gray-300 rounded-lg
    cursor-pointer shadow-lg transition-all duration-300
    ${selectable ? 'hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-blue-400' : ''}
    relative flex flex-col justify-between
    ${small ? 'p-0.5' : 'p-2'}
    ${className}
  `;

  return (
    <div className={cardClass} onClick={onClick}>
      {/* Sol üst köşe */}
      <div className={`flex flex-col items-center ${cornerSize}`}>
        <div className={`font-bold ${SUIT_COLORS[card.suit]} leading-none`}>
          {CARD_VALUES[card.value] || card.value}
        </div>
        <div className={`${SUIT_COLORS[card.suit]} ${fontSize} leading-none`}>
          {SUITS[card.suit]}
        </div>
      </div>

      {/* Ortadaki büyük sembol */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`${SUIT_COLORS[card.suit]} ${suitSize} font-bold`}>
          {SUITS[card.suit]}
        </div>
      </div>

      {/* Sağ alt köşe (ters) */}
      <div className={`flex flex-col items-center ${cornerSize} transform rotate-180 self-end`}>
        <div className={`font-bold ${SUIT_COLORS[card.suit]} leading-none`}>
          {CARD_VALUES[card.value] || card.value}
        </div>
        <div className={`${SUIT_COLORS[card.suit]} ${fontSize} leading-none`}>
          {SUITS[card.suit]}
        </div>
      </div>

      {/* Seçilebilir vurgusu */}
      {selectable && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-blue-400 hover:shadow-blue-200 pointer-events-none"></div>
      )}
    </div>
  );
};

export default Card;
