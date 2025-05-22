import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ searchTerm, setSearchTerm, handleSearch, dataList }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);

    if (value.trim().length > 0) {
      // ✅ Fix: exact startsWith, case-insensitive
      const filtered = dataList.filter(item => {
        return item?.toLowerCase().startsWith(value.toLowerCase());
      });

      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder="Search for patient's name..."
        className="w-full pl-4 pr-10 py-2 rounded-lg text-black bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
      />
      <button 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
        onClick={() => handleSearch(searchTerm)}
      >
        <Search size={20} />
      </button>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-md max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
