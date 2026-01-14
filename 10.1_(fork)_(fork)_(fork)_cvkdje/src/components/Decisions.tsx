import React from 'react';
    import { CheckSquare } from 'lucide-react';

    interface DecisionsProps {
      decisions: string;
      onDecisionsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    }

    export function Decisions({ decisions, onDecisionsChange }: DecisionsProps) {
      return (
        <div className="bg-black/20 p-4 md:p-6 rounded-lg animate-fade-in">
          <h3 className="text-xl font-medium text-amber-400 mb-4 flex items-center gap-2">
            <CheckSquare size={24} />
            القرارات
          </h3>
          <textarea
            value={decisions}
            onChange={onDecisionsChange}
            className="w-full p-2 rounded bg-black/20 border border-white/10 text-white text-sm"
            rows={4}
            placeholder="اكتب هنا القرارات التي اتخذتها"
            dir="rtl"
          />
        </div>
      );
    }
