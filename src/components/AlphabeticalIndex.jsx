import React from 'react';

const AlphabeticalIndex = ({ onSelectLetter }) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  
  return (
    <div className="flex flex-col items-center text-xs font-medium text-indigo-600 space-y-1 px-2">
      {alphabet.map((letter) => (
        <button 
          key={letter}
          className="hover:font-bold focus:outline-none"
          onClick={() => onSelectLetter(letter)}
        >
          {letter}
        </button>
      ))}
    </div>
  );
};

export default AlphabeticalIndex;