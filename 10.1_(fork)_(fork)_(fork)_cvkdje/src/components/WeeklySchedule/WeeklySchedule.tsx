import React, { useState, useCallback, useMemo, useRef } from 'react';
    import { Plus, Bell, Trash2, Check, ChevronDown, ChevronUp, X, Edit2, Target, Eye, EyeOff, Search } from 'lucide-react';
    import { Activity } from '../../types/activity';
    import { LIFE_DOMAINS } from '../../types/domains';
    import { ActivityProgress } from '../ActivityProgress';
    import { WeekSelector } from '../WeekSelector';
    import { useWeekSelection } from '../../hooks/useWeekSelection';
    import { DAYS } from '../../constants/days';
    import { WeekDisplay } from '../WeekDisplay';
    import { getDateOfWeek, getCurrentWeekDates, formatDate } from '../../utils/dateUtils';
    import { ActivityForm } from '../ActivityForm';
    import { ActivityContext } from '../../context/ActivityContext';
    import { makeLinksClickable } from '../../utils/linkUtils';
    import { DayBoxModal } from '../DayBoxModal';
    import { SearchInput } from './SearchInput';
    import { DayContent } from './DayContent';
    import { TableHeader } from './TableHeader';

    interface WeeklyScheduleProps {
      activities: Activity[];
      onToggleReminder: (activityId: string, dayIndex: number) => void;
      onEditActivity: (id: string, updates: Partial<Activity>) => void;
      onDeleteActivity: (id: string) => void;
    }

    export function WeeklySchedule({
      activities,
      onToggleReminder,
      onEditActivity,
      onDeleteActivity,
    }: WeeklyScheduleProps) {
      const { selectedDate, weekNumber, year, changeWeek } = useWeekSelection();
      const [selectedDay, setSelectedDay] = useState<number | null>(null);
      const [showConfirmation, setShowConfirmation] = useState(false);
      const [activityToDelete, setActivityToDelete] = useState<{id: string, dayIndex: number | null} | null>(null);
      const [hoveredDay, setHoveredDay] = useState<number | null>(null);
      const { addActivity } = React.useContext(ActivityContext);
      const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
      const [showGoals, setShowGoals] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const [searchResults, setSearchResults] = useState<any[]>([]);
      const [searchActive, setSearchActive] = useState(false);
      const searchInputRef = useRef<HTMLInputElement>(null);

      const weekStartDate = useMemo(() => getDateOfWeek(weekNumber, year), [weekNumber, year]);
      const weekDates = useMemo(() => getCurrentWeekDates(weekStartDate), [weekStartDate]);

      const currentWeekActivities = useMemo(() => activities.filter(activity =>
        activity.weekNumber === weekNumber &&
        activity.year === year
      ), [activities, weekNumber, year]);

      const handleAddActivity = useCallback((activity: Omit<Activity, 'id' | 'createdAt' | 'domainId'>) => {
        if (selectedDay !== null) {
          addActivity({
            ...activity,
            selectedDays: [selectedDay],
            weekNumber,
            year
          });
          setSelectedDay(null);
        }
      }, [selectedDay, addActivity, weekNumber, year]);

      const handleEditActivity = useCallback((activity: Activity) => {
        setEditingActivity(activity);
      }, []);

      const confirmDelete = useCallback(() => {
        if (activityToDelete) {
          const { id, dayIndex } = activityToDelete;
          if (dayIndex !== null) {
            onEditActivity(id, {
              completedDays: {
                ...activities.find(a => a.id === id)?.completedDays,
                [dayIndex]: false
              }
            });
          } else {
            onDeleteActivity(id);
          }
          setActivityToDelete(null);
          setShowConfirmation(false);
        }
      }, [activityToDelete, onEditActivity, onDeleteActivity, activities]);

      const cancelDelete = useCallback(() => {
        setActivityToDelete(null);
        setShowConfirmation(false);
      }, []);

      const handleSaveActivity = useCallback((updatedActivity: Activity) => {
        onEditActivity(editingActivity!.id, updatedActivity);
        setEditingActivity(null);
      }, [onEditActivity, editingActivity]);

      const toggleShowGoals = useCallback(() => {
        setShowGoals(!showGoals);
      }, [showGoals]);

      const calculateDayProgress = useCallback((dayIndex: number) => {
        const dayActivities = currentWeekActivities.filter(activity => activity.selectedDays?.includes(dayIndex));
        if (dayActivities.length === 0) return 0;

        let totalCount = 0;
        let completedCount = 0;

        dayActivities.forEach(activity => {
          totalCount += 1;
          if (activity.completedDays && activity.completedDays[dayIndex]) {
            completedCount += 1;
          }
        });

        return Math.round((completedCount / totalCount) * 100);
      }, [currentWeekActivities]);

      const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term) {
          const results = activities.reduce((acc, activity) => {
            const activityWeekStartDate = getDateOfWeek(activity.weekNumber, activity.year);
            const activityWeekDates = getCurrentWeekDates(activityWeekStartDate);

            if (
              activity.title.toLowerCase().includes(term.toLowerCase()) ||
              (activity.description && activity.description.toLowerCase().includes(term.toLowerCase()))
            ) {
              activity.selectedDays.forEach(dayIndex => {
                acc.push({
                  activity,
                  dayIndex,
                  date: activityWeekDates[dayIndex],
                  weekNumber: activity.weekNumber,
                  year: activity.year
                });
              });
            }
            return acc;
          }, [] as { activity: Activity, dayIndex: number, date: Date, weekNumber: number, year: number }[]);
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      };

      const handleSearchResultClick = (activity: Activity, dayIndex: number, weekNumber: number, year: number, date: Date) => {
        if (weekNumber !== selectedDate.getFullYear() && year !== selectedDate.getFullYear()) {
          changeWeek(weekNumber, year);
        }
        const activityElement = document.getElementById(`activity-${activity.id}-${dayIndex}`);
        if (activityElement) {
          activityElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setSearchTerm('');
          setSearchResults([]);
        }
      };

      const handleSearchClick = () => {
        setSearchActive(true);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      };

      const handleSearchBlur = () => {
        setTimeout(() => {
          setSearchActive(false);
        }, 100);
      };

      return (
        <div className="space-y-6" dir="rtl">
          <div className="flex items-center justify-center mb-2">
            <SearchInput
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onSearchClick={handleSearchClick}
              onSearchBlur={handleSearchBlur}
              searchResults={searchResults}
              onSearchResultClick={handleSearchResultClick}
              searchInputRef={searchInputRef}
              searchActive={searchActive}
              setSearchActive={setSearchActive}
              resultCount={searchResults.length}
            />
          </div>
          <div className="flex items-center justify-center mb-2">
            <WeekSelector
              currentDate={selectedDate}
              onWeekChange={changeWeek}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <TableHeader
                  onSelectDay={setSelectedDay}
                  calculateDayProgress={calculateDayProgress}
                  weekDates={weekDates}
                />
              </thead>
              <tbody>
                <tr>
                  {DAYS.map((_, dayIndex) => (
                    <td
                      key={dayIndex}
                      className={`p-3 border border-white/20 align-top ${hoveredDay !== null && hoveredDay !== dayIndex ? 'opacity-50 blur-sm' : ''}`}
                      onMouseEnter={() => setHoveredDay(dayIndex)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {selectedDay === dayIndex && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 p-6 rounded-lg w-full max-w-2xl relative">
                            <button
                              onClick={() => setSelectedDay(null)}
                              className="absolute top-4 right-4 text-white/70 hover:text-white"
                            >
                              <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-4 text-right">
                              إضافة نشاط ليوم {DAYS[dayIndex]}
                            </h2>
                            <ActivityForm
                              onSubmit={handleAddActivity}
                              weekNumber={weekNumber}
                              year={year}
                              initialDomainId={null}
                              hideDomainsSelect={false}
                              selectedDay={selectedDay}
                            />
                          </div>
                        </div>
                      )}
                      <DayContent
                        dayIndex={dayIndex}
                        activities={currentWeekActivities}
                        onEditActivity={onEditActivity}
                        onDeleteActivity={onDeleteActivity}
                        setActivityToDelete={setActivityToDelete}
                        setShowConfirmation={setShowConfirmation}
                        setEditingActivity={setEditingActivity}
                        showGoals={showGoals}
                        weekDates={weekDates}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-2">
            <button
              onClick={toggleShowGoals}
              className="p-1 rounded-full hover:bg-white/10 text-white transition-colors opacity-50"
            >
              {showGoals ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {editingActivity && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 p-6 rounded-lg w-full max-w-2xl relative">
                <button
                  onClick={() => setEditingActivity(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white mb-4 text-right">
                  تعديل النشاط
                </h2>
                <ActivityForm
                  onSubmit={(updatedActivity) => {
                    handleSaveActivity({ ...editingActivity, ...updatedActivity });
                  }}
                  initialDomainId={editingActivity.domainId}
                  weekNumber={editingActivity.weekNumber}
                  year={editingActivity.year}
                  activity={editingActivity}
                />
              </div>
            </div>
          )}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg text-black">
                <p className="mb-4">هل أنت متأكد من أنك تريد إلغاء هذا النشاط؟</p>
                <div className="flex justify-end gap-4">
                  <button onClick={confirmDelete} className="bg-green-500 text-white p-2 rounded">
                    نعم
                  </button>
                  <button onClick={cancelDelete} className="bg-red-500 text-white p-2 rounded">
                    لا
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
