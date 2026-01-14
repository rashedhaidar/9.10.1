import React, { useCallback } from 'react';
    import { Sparkles, Plus } from 'lucide-react';
    import { makeLinksClickable } from '../utils/linkUtils';

    interface PositiveNotesProps {
      positiveNotes: string[];
      onPositiveNoteChange: (index: number, value: string) => void;
      onAddPositiveNote: () => void;
    }

    export function PositiveNotes({ positiveNotes, onPositiveNoteChange, onAddPositiveNote }: PositiveNotesProps) {
      return (
        <div className="bg-black/20 p-4 md:p-6 rounded-lg animate-fade-in">
          <h3 className="text-xl font-medium text-amber-400 mb-4 flex items-center gap-2">
            <Sparkles size={24} />
            من نِعَم الله عليّ اليوم:
          </h3>
          <ul className="list-disc list-inside space-y-2">
            {positiveNotes.map((note, index) => (
              <li key={index} className="animate-row-in">
                <textarea
                  value={note}
                  onChange={(e) => onPositiveNoteChange(index, e.target.value)}
                  className="w-full p-1 rounded bg-black/20 border border-white/10 text-white text-sm"
                  rows={1}
                  placeholder={`اكتب هنا النقطة ${index + 1}`}
                  dir="rtl"
                />
              </li>
            ))}
          </ul>
          <button
            onClick={onAddPositiveNote}
            className="bg-amber-400 hover:bg-amber-500 text-black p-2 rounded-md flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            إضافة
          </button>
        </div>
      );
    }
