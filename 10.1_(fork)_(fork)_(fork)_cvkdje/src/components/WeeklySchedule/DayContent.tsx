import React, { useState } from 'react';
    import { Activity } from '../../types/activity';
    import { DayBoxModal } from '../DayBoxModal';

    interface DayContentProps {
      dayIndex: number;
      activities: Activity[];
      onEditActivity: (id: string, updates: Partial<Activity>) => void;
      onDeleteActivity: (id: string) => void;
      setActivityToDelete: React.Dispatch<React.SetStateAction<{id: string, dayIndex: number | null} | null>>;
      setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
      setEditingActivity: React.Dispatch<React.SetStateAction<Activity | null>>;
      showGoals: boolean;
      weekDates: Date[];
    }

    export function DayContent({ dayIndex, activities, onEditActivity, onDeleteActivity, setActivityToDelete, setShowConfirmation, setEditingActivity, showGoals, weekDates }: DayContentProps) {
      const { weekNumber, year } = useWeekSelection();
      const currentDate = weekDates[dayIndex];
      const dateKey = currentDate.toISOString().split('T')[0];
      const fullDateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
      const [dayBoxOpen, setDayBoxOpen] = useState<number | null>(null);

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {activities
              .filter(activity => activity.selectedDays?.includes(dayIndex))
              .map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <ActivityItem
                    activity={activity}
                    dayIndex={dayIndex}
                    onEditActivity={onEditActivity}
                    onDeleteActivity={onDeleteActivity}
                    setActivityToDelete={setActivityToDelete}
                    setShowConfirmation={setShowConfirmation}
                    setEditingActivity={setEditingActivity}
                    showGoals={showGoals}
                  />
                </div>
              ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setDayBoxOpen(dayIndex)}
              className="text-white/70 hover:text-white transition-colors p-2 rounded-md bg-teal-400/10 hover:bg-teal-400/20 flex items-center justify-center"
            >
              <span className="animate-pulse">صندوق اليوم</span>
            </button>
          </div>
          {dayBoxOpen === dayIndex && (
            <DayBoxModal
              dateKey={fullDateKey}
              onClose={() => setDayBoxOpen(null)}
              weekNumber={weekNumber}
              year={year}
              date={currentDate}
            />
          )}
        </div>
      );
    }
