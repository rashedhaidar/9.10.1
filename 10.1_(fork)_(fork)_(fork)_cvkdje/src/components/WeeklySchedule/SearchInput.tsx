import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
    import { Search } from 'lucide-react';
    import { Activity } from '../../types/activity';
    import { useWeekSelection } from '../../hooks/useWeekSelection';
    import { DAYS } from '../../constants/days';
    import { getDateOfWeek, getCurrentWeekDates, formatDate } from '../../utils/dateUtils';

    interface SearchInputProps {
      searchTerm: string;
      onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onSearchClick: () => void;
      onSearchBlur: () => void;
      searchResults: any[];
      onSearchResultClick: (activity: Activity, dayIndex: number, weekNumber: number, year: number, date: Date) => void;
      searchInputRef: React.RefObject<HTMLInputElement>;
      searchActive: boolean;
      setSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
      resultCount: number;
    }

    export function SearchInput({ searchTerm, onSearchChange, onSearchClick, onSearchBlur, searchResults, onSearchResultClick, searchInputRef, searchActive, setSearchActive, resultCount }: SearchInputProps) {
      const { weekDates, changeWeek, selectedDate } = useWeekSelection();

      const handleClickOutside = useCallback((e: MouseEvent) => {
        if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
          const searchResultsContainer = document.querySelector(".search-results-container");
          if (!searchResultsContainer || !searchResultsContainer.contains(e.target as Node)) {
            setSearchActive(false);
          }
        }
      }, [searchInputRef, setSearchActive]);

      useEffect(() => {
        if (searchActive) {
          document.addEventListener("mousedown", handleClickOutside);
        } else {
          document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [searchActive, setSearchActive, searchInputRef, handleClickOutside]);

      const stopPropagate = (event: any) => {
        event.stopPropagation();
      };

      const [isInputFocused, setIsInputFocused] = useState(false);

      return (
        <div className="relative w-full max-w-md">
          <div className={`absolute top-1/2 left-2 transform -translate-y-1/2 text-white/50 z-10 transition-opacity duration-200 ${isInputFocused ? 'opacity-0' : 'opacity-100'}`}>
            <Search size={16} onClick={onSearchClick} className="cursor-pointer" />
          </div>
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={onSearchChange}
            onBlur={(e) => {
              onSearchBlur();
              setIsInputFocused(false);
            }}
            onFocus={() => {
              onSearchClick();
              setIsInputFocused(true);
            }}
            ref={searchInputRef}
            onClick={onSearchClick}
            className={`bg-black/20 text-white rounded-lg px-3 py-1 border border-white/10 focus:border-white focus:ring-1 focus:ring-white text-sm md:text-base pl-8 w-full transition-all duration-300`}
            dir="rtl"
          />
          {searchActive && searchTerm && (
            <div className="absolute top-full left-0 mt-1 bg-black/80 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 w-full search-results-container" onMouseDown={stopPropagate}>
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSearchResultClick(result.activity, result.dayIndex, result.weekNumber, result.year, result.date);
                      setSearchActive(false);
                    }}
                    className="block w-full text-white text-right p-2 hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <span>{result.activity.title} - {DAYS[result.dayIndex]} - {formatDate(result.date)} - الأسبوع {result.weekNumber} - {result.year}</span>
                    {result.activity.completedDays && result.activity.completedDays[result.dayIndex] ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-red-400" />}
                  </button>
                ))
              ) : (
                <div className="text-white p-2">لا توجد نتائج</div>
              )}
            </div>
          )}
          {searchActive && searchTerm && (
            <div className="text-white text-sm mt-1 absolute bottom-0 left-0 w-full bg-black/50 p-1 rounded-b-md" style={{textAlign: 'left'}}>
              {searchResults.length} نتائج
            </div>
          )}
        </div>
      );
    }
