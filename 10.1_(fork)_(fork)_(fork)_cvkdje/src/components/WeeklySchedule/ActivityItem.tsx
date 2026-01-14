import React, { useState, useCallback, useMemo } from 'react';
    import { Edit2, Trash2, Check, Bell, Target } from 'lucide-react';
    import { Activity } from '../../types/activity';
    import { LIFE_DOMAINS } from '../../types/domains';
    import { makeLinksClickable } from '../../utils/linkUtils';
    import { ActivityProgress } from '../ActivityProgress';

    interface ActivityItemProps {
      activity: Activity;
      dayIndex: number;
      onEditActivity: (id: string, updates: Partial<Activity>) => void;
      onDeleteActivity: (id: string) => void;
      setActivityToDelete: React.Dispatch<React.SetStateAction<{id: string, dayIndex: number | null} | null>>;
      setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
      setEditingActivity: React.Dispatch<React.SetStateAction<Activity | null>>;
      showGoals: boolean;
    }

    export function ActivityItem({ activity, dayIndex, onEditActivity, onDeleteActivity, setActivityToDelete, setShowConfirmation, setEditingActivity, showGoals }: ActivityItemProps) {
      const isCompleted = activity.completedDays && activity.completedDays[dayIndex];
      const domain = LIFE_DOMAINS.find(d => d.id === activity.domainId);
      const Icon = domain?.icon || Edit2;
      const savedGoals = localStorage.getItem('goals');
      const goals = savedGoals ? JSON.parse(savedGoals) : [];
      const goal = goals.find((goal: any) => goal.id === activity.goalId);
      return (
        <div
          id={`activity-${activity.id}-${dayIndex}`}
          className={`p-4 rounded-lg flex items-start justify-between group ${
            isCompleted
              ? 'bg-green-500/20 border-green-500/40'
              : `bg-${domain?.color}-100/10 border border-${domain?.color}-400/20`
          }`}
        >
          <div>
            <h3 className="text-base font-medium" dir="rtl">{activity.title}</h3>
            {activity.description && (
              <p className="text-sm opacity-70" dir="rtl" dangerouslySetInnerHTML={{ __html: makeLinksClickable(activity.description) }} />
            )}
            {activity.reminder && (
              <div className="flex items-center gap-1 mt-2 text-xs text-white/70">
              <Bell size={14} />
              <span>{activity.reminder.time}</span>
              </div>
            )}
            {activity.targetCount !== undefined && (
              <ActivityProgress activity={activity} onUpdate={(updates) => onEditActivity(activity.id, updates)} />
            )}
            {showGoals && goal && (
              <div className={`flex items-center gap-1 mt-2 text-xs text-white/70`}>
                <Target size={12} />
                <span>{goal.title}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEditActivity(activity.id, {
                completedDays: {
                  ...activity.completedDays,
                  [dayIndex]: !isCompleted,
                }
              })}
              className={`p-2 rounded-full ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => setEditingActivity(activity)}
              className={`p-2 rounded-full bg-${domain?.color}-400/20 text-${domain?.color}-400 hover:bg-${domain?.color}-400/30 opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => {
                setActivityToDelete({id: activity.id, dayIndex});
                setShowConfirmation(true);
              }}
              className="p-2 rounded-full bg-red-400/20 text-red-400 hover:bg-red-400/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      );
    }
