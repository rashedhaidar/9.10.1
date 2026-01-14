import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
    import { Calendar, Edit, BookOpen, CheckSquare, Sparkles, Plus, Save, FileDown, FileUp, ChevronLeft, ChevronRight } from 'lucide-react';
    import { useWeekSelection } from '../hooks/useWeekSelection';
    import { formatDate, getWeekNumber, getDateOfWeek, getCurrentWeekDates, getTotalWeeks } from '../utils/dateUtils';
    import { DAYS } from '../constants/days';
    import { makeLinksClickable } from '../utils/linkUtils';
    import { WeekSelector } from './WeekSelector';
    import { PositiveNotes } from './PositiveNotes';
    import { FreeWriting } from './FreeWriting';
    import { Decisions } from './Decisions';

    interface WritingsProps {}

    export function Writings({ }: WritingsProps) {
      const { selectedDate, weekNumber, year, changeWeek } = useWeekSelection();
      const [selectedDay, setSelectedDay] = useState<number>(selectedDate.getDay());
      const weekDates = useMemo(() => getCurrentWeekDates(selectedDate), [selectedDate]);
      const currentDay = useMemo(() => DAYS[selectedDay], [selectedDay]);
      const currentDate = useMemo(() => formatDate(weekDates[selectedDay]), [weekDates, selectedDay]);

      const dateKey = useMemo(() => {
        return weekDates[selectedDay].toISOString().split('T')[0];
      }, [weekDates, selectedDay]);

      const [positiveNotes, setPositiveNotes] = useState<string[]>(() => {
        const savedNotes = localStorage.getItem(`positiveNotes-${dateKey}`);
        return savedNotes ? JSON.parse(savedNotes) : ['', '', '', '', ''];
      });
      const [freeWriting, setFreeWriting] = useState<string>(() => {
        return localStorage.getItem(`freeWriting-${dateKey}`) || '';
      });
      const [decisions, setDecisions] = useState<string>(() => {
        return localStorage.getItem(`decisions-${dateKey}`) || '';
      });

      useEffect(() => {
        const savedNotes = localStorage.getItem(`positiveNotes-${dateKey}`);
        setPositiveNotes(savedNotes ? JSON.parse(savedNotes) : ['', '', '', '', '']);
        setFreeWriting(localStorage.getItem(`freeWriting-${dateKey}`) || '');
        setDecisions(localStorage.getItem(`decisions-${dateKey}`) || '');
      }, [dateKey]);

      useEffect(() => {
        localStorage.setItem(`positiveNotes-${dateKey}`, JSON.stringify(positiveNotes));
      }, [positiveNotes, dateKey]);

      useEffect(() => {
        localStorage.setItem(`freeWriting-${dateKey}`, freeWriting);
      }, [freeWriting, dateKey]);

      useEffect(() => {
        localStorage.setItem(`decisions-${dateKey}`, decisions);
      }, [decisions, dateKey]);

      const handlePositiveNoteChange = useCallback((index: number, value: string) => {
        const newNotes = [...positiveNotes];
        newNotes[index] = value;
        setPositiveNotes(newNotes);
      }, [positiveNotes, setPositiveNotes]);

      const handleFreeWritingChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFreeWriting(e.target.value);
      }, [setFreeWriting]);

      const handleDecisionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDecisions(e.target.value);
      }, [setDecisions]);

      const handleDayChange = useCallback((dayIndex: number) => {
        setSelectedDay(dayIndex);
      }, [setSelectedDay]);

      const handlePrevDay = () => {
        setSelectedDay(prev => (prev === 0 ? 6 : prev - 1));
      };

      const handleNextDay = () => {
        setSelectedDay(prev => (prev === 6 ? 0 : prev + 1));
      };

      const handleWeekChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        changeWeek(parseInt(e.target.value), year);
      }, [changeWeek, year]);

      const currentYear = new Date().getFullYear();
      const totalWeeks = useMemo(() => getTotalWeeks(currentYear), [currentYear]);

      const handleAddPositiveNote = useCallback(() => {
        setPositiveNotes(prevNotes => [...prevNotes, '']);
      }, [setPositiveNotes]);

      const handleSave = useCallback(() => {
        localStorage.setItem(`positiveNotes-${dateKey}`, JSON.stringify(positiveNotes));
        localStorage.setItem(`freeWriting-${dateKey}`, freeWriting);
        localStorage.setItem(`decisions-${dateKey}`, decisions);
        alert('تم الحفظ بنجاح!');
      }, [positiveNotes, freeWriting, decisions, dateKey]);

      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleExport = useCallback(() => {
        const data = {
          positiveNotes: {},
          freeWriting: {},
          decisions: {},
        };

        const currentYear = new Date().getFullYear();
        const totalWeeks = getTotalWeeks(currentYear);

        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
          for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
            const weekStartDate = getDateOfWeek(weekNumber, year);
            const weekDates = getCurrentWeekDates(weekStartDate);
            weekDates.forEach(date => {
              const dateKey = date.toISOString().split('T')[0];
              const positiveNotesData = localStorage.getItem(`positiveNotes-${dateKey}`);
              const freeWritingData = localStorage.getItem(`freeWriting-${dateKey}`);
              const decisionsData = localStorage.getItem(`decisions-${dateKey}`);

              if (positiveNotesData || freeWritingData || decisionsData) {
                data.positiveNotes[dateKey] = positiveNotesData ? JSON.parse(positiveNotesData) : [];
                data.freeWriting[dateKey] = freeWritingData || '';
                data.decisions[dateKey] = decisionsData || '';
              }
            });
          }
        }

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'writings_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, []);

      const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            if (importedData.positiveNotes && importedData.freeWriting && importedData.decisions) {
              const currentYear = new Date().getFullYear();
              const totalWeeks = getTotalWeeks(currentYear);

              for (let year = currentYear - 2; year <= currentYear + 2; year++) {
                for (let weekNumber = 1; weekNumber <= totalWeeks; weekDates) {
                  const weekStartDate = getDateOfWeek(weekNumber, year);
                  const weekDates = getCurrentWeekDates(weekStartDate);
                  weekDates.forEach(date => {
                    const dateKey = date.toISOString().split('T')[0];
                    localStorage.setItem(`positiveNotes-${dateKey}`, JSON.stringify(importedData.positiveNotes[dateKey] || ['', '', '', '', '']));
                    localStorage.setItem(`freeWriting-${dateKey}`, importedData.freeWriting[dateKey] || '');
                    localStorage.setItem(`decisions-${dateKey}`, importedData.decisions[dateKey] || '');
                  });
                }
              }
              alert('تم استيراد البيانات بنجاح!');
              window.location.reload();
            } else {
              alert('Invalid data format. Please ensure the file contains "positiveNotes", "freeWriting", and "decisions" properties.');
            }
          } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file. Please ensure it is a valid JSON file.');
          }
        };
        reader.readAsText(file);
      }, []);

      return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 rounded-lg shadow-lg text-white space-y-6" dir="rtl">
          <div className="flex flex-col md:flex-row items-center justify-center mb-4">
            <h2 className="text-3xl font-bold text-center text-amber-400 animate-pulse">
              <BookOpen size={32} className="inline-block align-middle ml-2" />
              صفحة المدوّنات
            </h2>
          </div>
          <div className="flex items-center justify-center mb-2">
            <WeekSelector
              currentDate={selectedDate}
              onWeekChange={changeWeek}
            />
          </div>

          <div className="bg-black/20 p-4 rounded-lg flex items-center justify-between">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <div className="text-center">
              <div className="text-sm text-white/70">{DAYS[selectedDay]}</div>
              <div className="text-xs text-white/50">{formatDate(weekDates[selectedDay])}</div>
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <PositiveNotes
            positiveNotes={positiveNotes}
            onPositiveNoteChange={handlePositiveNoteChange}
            onAddPositiveNote={handleAddPositiveNote}
          />
          <FreeWriting
            freeWriting={freeWriting}
            onFreeWritingChange={handleFreeWritingChange}
          />
          <Decisions
            decisions={decisions}
            onDecisionsChange={handleDecisionsChange}
          />
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-black p-2 rounded-md hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Save size={20} />
              حفظ
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={handleExport} className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-md flex items-center gap-2 transition-colors mr-2">
              <FileDown size={16} />
              تصدير
            </button>
            <input type="file" id="file-upload" onChange={handleImport} className="hidden" accept=".json" ref={fileInputRef} />
            <label htmlFor="file-upload" className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-md flex items-center gap-2 transition-colors cursor-pointer">
              <FileUp size={16} />
              استيراد
            </label>
          </div>
        </div>
      );
    }
