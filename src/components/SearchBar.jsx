import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ searchTerm, setSearchTerm, handleSearch }) => {
  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder="Search for patient's name..."
        className="w-full pl-4 pr-10 py-2 rounded-lg bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
        onClick={handleSearch}
      >
        <Search size={20} />
      </button>
    </div>
  );
};

export default SearchBar;