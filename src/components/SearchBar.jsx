import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// Advanced fuzzy search with comprehensive case-insensitive matching
const createFuzzySearch = (items, options = {}) => {
  const { keys = [], threshold = 0.3 } = options;
  
  const search = (query) => {
    if (!query || !query.trim()) return [];
    
    const originalQuery = query.trim();
    const searchTerm = originalQuery.toLowerCase();
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    return items
      .map(item => {
        let originalText = '';
        let searchableText = '';
        
        // Handle both strings and objects
        if (typeof item === 'string') {
          originalText = item;
          searchableText = item.toLowerCase();
        } else if (typeof item === 'object' && item !== null) {
          // If keys are specified, search in those fields
          if (keys.length > 0) {
            originalText = keys
              .map(key => {
                const value = key.split('.').reduce((obj, k) => obj?.[k], item);
                return value ? String(value) : '';
              })
              .join(' ');
          } else {
            // Search in all string values of the object
            originalText = Object.values(item)
              .filter(val => typeof val === 'string')
              .join(' ');
          }
          searchableText = originalText.toLowerCase();
        }
        
        if (!searchableText || !originalText) return { item, score: 0 };
        
        let score = 0;
        
        // CASE VARIATIONS MATCHING - Create different case variations of the search term
        const searchVariations = [
          searchTerm,                           // raju
          searchTerm.toUpperCase(),            // RAJU  
          searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1), // Raju
          searchTerm.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')  // Title Case for multi-word
        ];
        
        // Check against all case variations for exact matches first
        let foundMatch = false;
        searchVariations.forEach(variation => {
          if (foundMatch) return; // Skip if we already found a high-score match
          
          // Exact match (highest priority)
          if (originalText === variation) {
            score = Math.max(score, 1000);
            foundMatch = true;
          }
          // Starts with match
          else if (originalText.startsWith(variation)) {
            score = Math.max(score, 900);
            foundMatch = true;
          }
          // Contains match
          else if (originalText.includes(variation)) {
            score = Math.max(score, 800);
            foundMatch = true;
          }
        });
        
        // Case-insensitive fallback matching if no exact case match found
        if (!foundMatch) {
          // Exact match (case-insensitive)
          if (searchableText === searchTerm) {
            score = 950;
          }
          // Starts with (case-insensitive)  
          else if (searchableText.startsWith(searchTerm)) {
            score = 850;
          }
          // Contains (case-insensitive)
          else if (searchableText.includes(searchTerm)) {
            score = 750;
          }
          // All words present (case-insensitive)
          else if (searchWords.every(word => searchableText.includes(word))) {
            score = 600;
            
            // Bonus for word boundaries
            searchWords.forEach(word => {
              const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              if (wordBoundaryRegex.test(originalText)) {
                score += 100;
              }
            });
          }
          // Partial word matches
          else {
            const matchedWords = searchWords.filter(word => searchableText.includes(word));
            if (matchedWords.length > 0) {
              score = (matchedWords.length / searchWords.length) * 400;
            }
          }
        }
        
        // Additional scoring bonuses
        if (score > 0) {
          // Bonus for exact case match in original query
          if (originalText.includes(originalQuery)) {
            score += 50;
          }
          
          // Bonus for word start matches
          searchWords.forEach(word => {
            const wordStartRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
            if (wordStartRegex.test(originalText)) {
              score += 25;
            }
          });
        }
        
        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  };
  
  return { search };
};

const SearchBar = ({ searchTerm, setSearchTerm, handleSearch, dataList = [] }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Create fuzzy search instance
  const fuzzySearch = useMemo(() => {
    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      return { search: () => [] };
    }
    
    // Auto-detect if we're dealing with objects or strings
    const firstItem = dataList[0];
    let searchOptions = { threshold: 0.3 };
    
    if (typeof firstItem === 'object' && firstItem !== null) {
      // Common object keys to search in
      const possibleKeys = ['name', 'title', 'label', 'text', 'value'];
      const availableKeys = possibleKeys.filter(key => firstItem.hasOwnProperty(key));
      
      if (availableKeys.length > 0) {
        searchOptions.keys = availableKeys;
      }
    }
    
    return createFuzzySearch(dataList, searchOptions);
  }, [dataList]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);

    if (value.trim().length > 0) {
      const results = fuzzySearch.search(value);
      setSuggestions(results.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Handle both string and object suggestions
    const displayValue = typeof suggestion === 'string' 
      ? suggestion 
      : suggestion.name || suggestion.title || suggestion.label || String(suggestion);
    
    setSearchTerm(displayValue);
    handleSearch(displayValue);
    setShowSuggestions(false);
  };

  // Get display text for suggestions
  const getDisplayText = (item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.name || item.title || item.label || item.text || JSON.stringify(item);
    }
    return String(item);
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    let highlightedText = text;
    
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder="Search for patient's name..."
        className="w-full pl-4 pr-10 py-2 rounded-lg text-black bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (searchTerm.trim() && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        autoComplete="off"
      />
      <button 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors duration-200"
        onClick={() => handleSearch(searchTerm)}
      >
        <Search size={20} />
      </button>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-64 overflow-y-auto">
          <div className="py-1">
            {suggestions.map((suggestion, index) => {
              const displayText = getDisplayText(suggestion);
              return (
                <div
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-indigo-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightMatch(displayText, searchTerm) 
                    }}
                  />
                </div>
              );
            })}
          </div>
          
          {searchTerm.trim() && suggestions.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 bg-gray-50">
              {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;