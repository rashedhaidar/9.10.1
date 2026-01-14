import React, { useState, useRef, useContext, useEffect, useCallback, useMemo } from 'react';
import { Activity } from '../types/activity';
import { LIFE_DOMAINS } from '../types/domains';
import { useWeekSelection } from '../hooks/useWeekSelection';
import { DAYS } from '../constants/days';
import { Brain, Award, Calendar, Download, Upload, Check, X, AlertTriangle, FileDown, FileUp, Eye, EyeOff, Plus, BookOpen, MessageSquare, Sparkles, Zap, Target, Heart, Users, DollarSign, Globe, Feather } from 'lucide-react';
import { ProgressView } from './ProgressView';
import { WeekSelector } from './WeekSelector';
import { ActivityContext } from '../context/ActivityContext';
import { formatDate, getCurrentWeekDates, getDateOfWeek, getTotalWeeks, getStorageDateKey } from '../utils/dateUtils';
import { makeLinksClickable } from '../utils/linkUtils';
import { AIInsights } from './AIInsights';

interface EvaluationProps {
  activities: Activity[];
}

export function Evaluation({ activities }: EvaluationProps) {
  const weekSelection = useWeekSelection();
  const { selectedDate, weekNumber, year, changeWeek } = weekSelection;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addActivity, updateActivity, deleteActivity } = useContext(ActivityContext);
  const currentWeekActivities = useMemo(() => activities.filter(activity => activity.weekNumber === weekNumber && activity.year === year), [activities, weekNumber, year]);
  
  // New state for filtering scope: 'week', 'month', or 'all'
  const [filterScope, setFilterScope] = useState<'week' | 'month' | 'all'>('week'); 
  
  const [showDomains, setShowDomains] = useState(true);
  const [achievements, setAchievements] = useState<string[]>(() => {
    const savedAchievements = localStorage.getItem(`achievements-${weekNumber}-${year}`);
    return savedAchievements ? JSON.parse(savedAchievements) : [];
  });
  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('financialTransactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const weekStartDate = useMemo(() => getDateOfWeek(weekNumber, year), [weekNumber, year]);
  const weekDates = useMemo(() => getCurrentWeekDates(weekStartDate), [weekStartDate]);

  useEffect(() => {
    const savedAchievements = localStorage.getItem(`achievements-${weekNumber}-${year}`);
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements));
      } catch (e) {
        console.error("Error parsing achievements:", savedAchievements, e);
        setAchievements([]);
      }
    } else {
      setAchievements([]);
    }
  }, [weekNumber, year]);

  const calculateDomainProgress = useCallback((domainId: string, activitiesToUse: Activity[]) => {
    const domainActivities = activitiesToUse.filter(a => a.domainId === domainId);
    if (domainActivities.length === 0) return { completed: 0, total: 0, percentage: 0 };

    let totalCount = 0;
    let completedCount = 0;

    domainActivities.forEach(activity => {
      totalCount += activity.selectedDays.length;
      completedCount += activity.selectedDays.filter(dayIndex => activity.completedDays && activity.completedDays[dayIndex]).length;
    });

    return {
      completed: completedCount,
      total: totalCount,
      percentage: Math.round((completedCount / totalCount) * 100),
    };
  }, []);

  const overallCompletionRate = useCallback((activitiesToUse: Activity[]) => {
    let totalCount = 0;
    const totalActivities = activitiesToUse.reduce((acc, activity) => acc + activity.selectedDays.length, 0);
    if (totalActivities === 0) return {completed: 0, total: 0, percentage: 0};

    let completedCount = 0;
    activitiesToUse.forEach(activity => {
      completedCount += activity.selectedDays.filter(dayIndex => activity.completedDays && activity.completedDays[dayIndex]).length;
    });
    return {
      completed: completedCount,
      total: totalActivities,
      percentage: Math.round((completedCount / totalActivities) * 100),
    };
  }, []);

  const overallRate = useMemo(() => overallCompletionRate(currentWeekActivities), [overallCompletionRate, currentWeekActivities]);

  const handleExport = useCallback((format: 'text' | 'json') => {
    const allData = {
      activities: activities,
      goals: JSON.parse(localStorage.getItem('goals') || '[]'),
      achievements: {},
      transactions: transactions,
      freeWriting: {},
      decisions: {},
      positiveNotes: {},
    };
  
    const currentYear = new Date().getFullYear();
    const totalWeeks = getTotalWeeks(currentYear);
  
    // Iterate over a reasonable range of years/weeks to collect historical data
    const startYear = currentYear - 2;
    const endYear = currentYear + 2;

    for (let year = startYear; year <= endYear; year++) {
      const weeksInYear = getTotalWeeks(year);
      for (let weekNumber = 1; weekNumber <= weeksInYear; weekNumber++) {
        const weekKey = `${weekNumber}-${year}`;
        allData.achievements[weekKey] = localStorage.getItem(`achievements-${weekKey}`) ? JSON.parse(localStorage.getItem(`achievements-${weekKey}`)!) : [];
  
        const weekStartDate = getDateOfWeek(weekNumber, year);
        const weekDates = getCurrentWeekDates(weekStartDate);
        
        // Collect daily data for the week
        weekDates.forEach((date) => {
          // CRITICAL FIX: Use getStorageDateKey for consistent storage/retrieval keys
          const dateKey = getStorageDateKey(date); 
          allData.freeWriting[dateKey] = localStorage.getItem(`freeWriting-${dateKey}`) || '';
          allData.decisions[dateKey] = localStorage.getItem(`decisions-${dateKey}`) || '';
          allData.positiveNotes[dateKey] = localStorage.getItem(`positiveNotes-${dateKey}`) ? JSON.parse(localStorage.getItem(`positiveNotes-${dateKey}`)!) : [];
        });
      }
    }
  
    const dataStr = format === 'json' ? JSON.stringify(allData, null, 2) : JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_data.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activities, transactions]);

  const handleImport = useCallback((format: 'text' | 'json') => {
    fileInputRef.current?.click();
    fileInputRef.current?.setAttribute('accept', format === 'json' ? 'application/json' : 'text/plain');
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const importedData = JSON.parse(fileContent);
  
        if (importedData) {
          if (importedData.activities) {
            // Clear existing activities
            activities.forEach(activity => deleteActivity(activity.id));
            // Import new activities
            importedData.activities.forEach(activity => {
              const { id, ...rest } = activity;
              addActivity(rest);
            });
          }
  
          if (importedData.goals) {
            localStorage.setItem('goals', JSON.stringify(importedData.goals));
          }
  
          if (importedData.achievements) {
            for (const weekKey in importedData.achievements) {
              localStorage.setItem(`achievements-${weekKey}`, JSON.stringify(importedData.achievements[weekKey]));
            }
          }
  
          if (importedData.transactions) {
            localStorage.setItem('financialTransactions', JSON.stringify(importedData.transactions));
            setTransactions(importedData.transactions);
          }
  
          if (importedData.freeWriting) {
            for (const dateKey in importedData.freeWriting) {
              localStorage.setItem(`freeWriting-${dateKey}`, importedData.freeWriting[dateKey]);
            }
          }
  
          if (importedData.decisions) {
            for (const dateKey in importedData.decisions) {
              localStorage.setItem(`decisions-${dateKey}`, importedData.decisions[dateKey]);
            }
          }
  
          if (importedData.positiveNotes) {
            for (const dateKey in importedData.positiveNotes) {
              localStorage.setItem(`positiveNotes-${dateKey}`, JSON.stringify(importedData.positiveNotes[dateKey]));
            }
          }
  
          alert('Data imported successfully!');
          window.location.reload();
        } else {
          alert('Invalid data format. Please ensure the file contains an object with "activities", "goals", "achievements", "transactions", "freeWriting", "decisions", and "positiveNotes".');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  }, [activities, addActivity, deleteActivity, setTransactions]);

  const toggleDomains = useCallback(() => {
    setShowDomains(!showDomains);
  }, [showDomains]);

  const handleAddAchievement = useCallback(() => {
    setAchievements([...achievements, '']);
  }, [achievements, setAchievements]);

  const handleRemoveAchievement = useCallback((index: number) => {
    const newAchievements = [...achievements];
    newAchievements.splice(index, 1);
    setAchievements(newAchievements);
    localStorage.setItem(`achievements-${weekNumber}-${year}`, JSON.stringify(newAchievements));
  }, [achievements, setAchievements, weekNumber, year]);

  const handleAchievementChange = useCallback((index: number, value: string) => {
    const newAchievements = [...achievements];
    newAchievements[index] = value;
    setAchievements(newAchievements);
    localStorage.setItem(`achievements-${weekNumber}-${year}`, JSON.stringify(newAchievements));
  }, [achievements, setAchievements, weekNumber, year]);

  // Refactored Domain Styles for a vibrant, cosmic look
  const domainStyleMap = useMemo(() => ({
    'professional': { color: '#00FFFF', icon: Zap, name: 'المهني' }, // Neon Cyan
    'educational': { color: '#BF00FF', icon: BookOpen, name: 'التعليمي' }, // Electric Purple
    'health': { color: '#39FF14', icon: Heart, name: 'الصحي' }, // Lime Green
    'family': { color: '#FF1493', icon: Users, name: 'العائلي' }, // Deep Pink
    'social': { color: '#FF8C00', icon: Globe, name: 'الاجتماعي' }, // Dark Orange
    'financial': { color: '#00FA9A', icon: DollarSign, name: 'المالي' }, // Medium Spring Green
    'personal': { color: '#1E90FF', icon: Feather, name: 'الشخصي' }, // Dodger Blue
    'spiritual': { color: '#FFFFFF', icon: Target, name: 'الروحي' }, // White/Silver
  }), []);

  // --- Filtering Logic ---

  const handleScopeChange = (scope: 'week' | 'month' | 'all') => {
    setFilterScope(scope);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const getMonthName = (month: number) => {
    const monthNames = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
    return monthNames[month];
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - 2 + i), [currentYear]);

  // Filter activities based on scope
  const filteredActivities = useMemo(() => {
    if (filterScope === 'week') {
      return currentWeekActivities;
    }
    
    if (filterScope === 'month') {
      return activities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate.getMonth() === selectedMonth && activityDate.getFullYear() === selectedYear;
      });
    }

    // 'all' scope
    return activities;
  }, [activities, currentWeekActivities, selectedMonth, selectedYear, filterScope]);

  const filteredOverallRate = useMemo(() => {
    return overallCompletionRate(filteredActivities);
  }, [filteredActivities, overallCompletionRate]);

  const mergedActivities = useMemo(() => {
    const merged: Record<string, {
      title: string;
      domainId: string;
      planned: number;
      completed: number;
      completedDays: { [dayIndex: number]: boolean } | undefined;
    }> = {};

    filteredActivities.forEach(activity => {
      if (!merged[activity.title]) {
        merged[activity.title] = {
          title: activity.title,
          domainId: activity.domainId,
          planned: 0,
          completed: 0,
          completedDays: activity.completedDays,
        };
      }
      merged[activity.title].planned += activity.selectedDays.length;
      if (activity.completedDays) {
        merged[activity.title].completed += activity.selectedDays.filter(dayIndex => activity.completedDays[dayIndex]).length;
      }
    });

    return Object.values(merged);
  }, [filteredActivities]);

  const handleDomainClick = (domainId: string) => {
    const domainElement = document.getElementById(`domain-${domainId}`);
    if (domainElement) {
      domainElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 rounded-lg shadow-2xl text-white border border-purple-700/50" dir="rtl">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <h2 className="text-3xl font-extrabold text-white text-center tracking-wider" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>
          لوحة تقييم الأداء
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={toggleDomains} className="p-2 rounded-full bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 transition-all duration-300 shadow-md">
            {showDomains ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <div className="relative group">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-full flex items-center gap-2 transition-colors shadow-md"
            >
              <Download size={16} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl z-50 w-48 border border-gray-700/50 overflow-hidden">
                <button
                  onClick={() => {
                    handleExport('json');
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-white text-right p-3 hover:bg-white/10 transition-colors text-sm flex items-center justify-end gap-2"
                >
                  تصدير JSON <FileDown size={16} />
                </button>
                <button
                  onClick={() => {
                    handleExport('text');
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-white text-right p-3 hover:bg-white/10 transition-colors text-sm flex items-center justify-end gap-2"
                >
                  تصدير نص <FileDown size={16} />
                </button>
                <hr className="border-gray-700/50" />
                <button
                  onClick={() => {
                    handleImport('json');
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-white text-right p-3 hover:bg-white/10 transition-colors text-sm flex items-center justify-end gap-2"
                >
                  استيراد JSON <FileUp size={16} />
                </button>
                <button
                  onClick={() => {
                    handleImport('text');
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-white text-right p-3 hover:bg-white/10 transition-colors text-sm flex items-center justify-end gap-2"
                >
                  استيراد نص <FileUp size={16} />
                </button>
              </div>
            )}
            <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} accept="text/plain,application/json" />
          </div>
        </div>
      </div>
      
      {/* Scope Selector UI */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-3 bg-black/20 rounded-xl">
        <div className="flex gap-2 p-1 bg-black/40 rounded-full border border-white/10">
          <button
            onClick={() => handleScopeChange('week')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filterScope === 'week' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
          >
            الأسبوع الحالي
          </button>
          <button
            onClick={() => handleScopeChange('month')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filterScope === 'month' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
          >
            الشهر المحدد
          </button>
          <button
            onClick={() => handleScopeChange('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filterScope === 'all' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
          >
            كافة الأنشطة (الكل)
          </button>
        </div>

        {filterScope === 'week' && (
          <WeekSelector currentDate={selectedDate} onWeekChange={changeWeek} />
        )}

        {filterScope === 'month' && (
          <div className="flex items-center justify-center gap-4">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className={`bg-black/40 text-white rounded-lg px-4 py-2 border border-white/10 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 text-sm md:text-base transition-all`}
              dir="rtl"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className={`bg-black/40 text-white rounded-lg px-4 py-2 border border-white/10 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 text-sm md:text-base transition-all`}
              dir="rtl"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-indigo-700/30 to-fuchsia-700/30 p-8 rounded-xl shadow-xl border border-fuchsia-500/30">
          <div className="flex flex-col items-center justify-center mb-4">
            <Brain className="text-fuchsia-400 mx-auto mb-2 animate-pulse-slow" size={40} />
            <h2 className="text-3xl font-extrabold text-fuchsia-300 tracking-wide">معدل الإنجاز العام</h2>
            <p className="text-6xl font-black text-white mt-4" style={{ textShadow: '0 0 15px #FFD700', color: '#FFD700' }}>
              {filteredOverallRate.percentage}%
            </p>
            <p className="text-md text-white/80 mt-1">
              {filteredOverallRate.completed} من {filteredOverallRate.total} أنشطة مكتملة
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <ProgressView activities={filteredActivities} />
          </div>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 ${showDomains ? '' : 'hidden'}`}>
          {LIFE_DOMAINS.map(domain => {
            const progress = calculateDomainProgress(domain.id, filteredActivities);
            const style = domainStyleMap[domain.id as keyof typeof domainStyleMap];
            const DomainIcon = style.icon;
            const domainColor = style.color;

            return (
              <div id={`domain-${domain.id}`} key={domain.id} className={`bg-black/30 p-5 rounded-xl flex flex-col border border-white/10 hover:border-white/30 transition-all duration-300 domain-box`}>
                <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                  <DomainIcon size={28} style={{ color: domainColor }} />
                  <h3 className={`text-xl font-bold`} style={{ color: domainColor, textShadow: '0 0 5px rgba(0, 0, 0, 0.5)' }}>{domain.name}</h3>
                  <span className="text-white text-sm ml-auto bg-white/10 px-3 py-1 rounded-full font-mono">
                    {progress.percentage}%
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-white/80 border-b border-white/20 text-right font-semibold">النشاط</th>
                      <th className="p-2 text-white/80 border-b border-white/20 text-center font-semibold">المخطط/المنفذ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedActivities
                      .filter(activity => activity.domainId === domain.id)
                      .map(activity => {
                        const completedPercentage = activity.planned > 0 ? Math.round((activity.completed / activity.planned) * 100) : 0;
                        let statusIcon = null;
                        if (completedPercentage === 100) {
                          statusIcon = <Check size={16} className="text-lime-400" />;
                        } else if (completedPercentage > 0) {
                          statusIcon = <AlertTriangle size={16} className="text-amber-400" />;
                        } else {
                          statusIcon = <X size={16} className="text-red-400" />;
                        }
                        return (
                          <tr key={activity.title} className="hover:bg-white/5 transition-colors">
                            <td className="p-2 text-white border-b border-white/10 text-right flex items-center gap-2">
                              {activity.title}
                              {statusIcon}
                            </td>
                            <td className="p-2 text-white border-b border-white/10 text-center font-mono">
                              {activity.completed} / {activity.planned}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 p-6 rounded-xl shadow-xl border border-amber-500/30">
          <h2 className="text-2xl font-bold text-amber-300 mb-4 flex items-center gap-3">
            <Award size={28} className="text-amber-300" />
            أبرز الإنجازات في الأسبوع
          </h2>
          {achievements.map((achievement, index) => (
            <div key={index} className="relative mb-3 flex items-center bg-black/40 p-3 rounded-lg border border-amber-400/20 shadow-inner">
              <input
                type="text"
                value={achievement}
                onChange={(e) => handleAchievementChange(index, e.target.value)}
                className="flex-grow p-2 rounded bg-transparent border-none text-white text-base focus:ring-0 focus:outline-none"
                dir="rtl"
                placeholder={`إنجاز ${index + 1}`}
              />
              <button
                onClick={() => handleRemoveAchievement(index)}
                className="p-1 rounded-full bg-red-500/30 text-red-300 hover:bg-red-500/50 transition-colors ml-2"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddAchievement}
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold p-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Plus size={18} />
            إضافة إنجاز جديد
          </button>
        </div>
        
        {/* Daily Entries Section - Only visible in 'week' scope */}
        {filterScope === 'week' && (
          <div className="space-y-6">
            <div className="bg-black/30 p-5 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
                  <MessageSquare size={24} className="text-blue-400" />
                  القرارات اليومية (للأسبوع الحالي)
                </h3>
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        {DAYS.map((day, index) => (
                          <th key={day} className="p-3 text-white/80 border border-white/20 bg-white/5 min-w-[150px]">
                            <div className="flex flex-col items-center">
                              <span>{day}</span>
                              <span className="text-xs text-white/60">{formatDate(weekDates[index])}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {weekDates.map((date, index) => {
                          // CRITICAL FIX: Use getStorageDateKey for consistent retrieval
                          const dateKey = getStorageDateKey(date);
                          const decisions = localStorage.getItem(`decisions-${dateKey}`);
                          return (
                            <td key={index} className="p-3 text-white border border-white/10 align-top bg-black/20">
                              <p className="text-white text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: makeLinksClickable(decisions || 'لا يوجد قرار مسجل') }} />
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-black/30 p-5 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
                  <Sparkles size={24} className="text-pink-400" />
                  ملخص النقاط الإيجابية (للأسبوع الحالي)
                </h3>
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        {DAYS.map((day, index) => (
                          <th key={day} className="p-3 text-white/80 border border-white/20 bg-white/5 min-w-[150px]">
                            <div className="flex flex-col items-center">
                              <span>{day}</span>
                              <span className="text-xs text-white/60">{formatDate(weekDates[index])}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {weekDates.map((date, index) => {
                          // CRITICAL FIX: Use getStorageDateKey for consistent retrieval
                          const dateKey = getStorageDateKey(date);
                          const notes = localStorage.getItem(`positiveNotes-${dateKey}`);
                          let parsedNotes: string[] = [];
                          if (notes) {
                            try {
                              parsedNotes = JSON.parse(notes);
                            } catch (e) {
                              console.error("Error parsing positive notes:", notes, e);
                            }
                          }
                          return (
                            <td key={index} className="p-3 text-white border border-white/10 align-top bg-black/20">
                              <ul className="list-disc list-inside text-white/70 text-sm space-y-1" dir="rtl">
                                {parsedNotes && parsedNotes.length > 0 ? (
                                  parsedNotes.map((note, noteIndex) => (
                                    <li key={noteIndex} dangerouslySetInnerHTML={{ __html: makeLinksClickable(note) }} />
                                  ))
                                ) : (
                                  <li className="text-white/50">لا توجد نقاط إيجابية مسجلة</li>
                                )}
                              </ul>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        )}
        {filterScope !== 'week' && (
          <div className="mt-8 p-6 bg-black/30 rounded-xl border border-white/10 text-center">
            <p className="text-white/70">يتم عرض ملخص الأنشطة والإنجازات للمجالات المختارة. لعرض القرارات والنقاط الإيجابية اليومية، يرجى التبديل إلى وضع "الأسبوع الحالي".</p>
          </div>
        )}
      </div>
    </div>
  );
}
