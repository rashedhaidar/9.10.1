import React from 'react';
    import { Calendar } from 'lucide-react';
    import { DAYS } from '../../constants/days';
    import { formatDate } from '../../utils/dateUtils';
    import { DayProgressIndicator } from '../DayProgressIndicator';

    interface TableHeaderProps {
      onSelectDay: (dayIndex: number) => void;
      calculateDayProgress: (dayIndex: number) => number;
      weekDates: Date[];
    }

    export function TableHeader({ onSelectDay, calculateDayProgress, weekDates }: TableHeaderProps) {
      return (
        <tr>
          {DAYS.map((day, index) => (
            <th key={day} className="p-1 text-white border border-white/20 text-center">
              <div className="flex items-center justify-center flex-col">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm">{day}</span>
                  <button
                    onClick={() => onSelectDay(index)}
                    className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-xs text-white/70">
                  {weekDates && formatDate(weekDates[index])}
                </span>
                <DayProgressIndicator percentage={calculateDayProgress(index)}/>
              </div>
            </th>
          ))}
        </tr>
      );
    }
