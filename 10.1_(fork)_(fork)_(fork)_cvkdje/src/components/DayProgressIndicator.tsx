import React from 'react';

    interface DayProgressIndicatorProps {
      percentage: number;
    }

    export function DayProgressIndicator({ percentage }: DayProgressIndicatorProps) {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (circumference * percentage / 100);
      const color = percentage === 100 ? 'rgba(0, 128, 0, 0.7)' : 'rgba(0, 128, 0, 0.4)';

      return (
        <div className="relative w-full h-2 mt-1">
          <div className="bg-black/30 rounded-full overflow-hidden w-full h-full">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-500 ease-in-out"
              style={{
                width: `${percentage}%`,
                background: color,
                borderRadius: '10px',
              }}
            />
          </div>
          <span 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold z-10 flex items-center justify-center w-full h-full"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.7rem',
            }}
          >
            {percentage}%
          </span>
        </div>
      );
    }
