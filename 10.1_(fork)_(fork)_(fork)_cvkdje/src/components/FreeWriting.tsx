import React from 'react';
    import { Edit } from 'lucide-react';

    interface FreeWritingProps {
      freeWriting: string;
      onFreeWritingChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    }

    export function FreeWriting({ freeWriting, onFreeWritingChange }: FreeWritingProps) {
      return (
        <div className="bg-black/20 p-4 md:p-6 rounded-lg animate-fade-in">
          <h3 className="text-xl font-medium text-amber-400 mb-4 flex items-center gap-2">
            <Edit size={24} />
            الكتابة الحرة
          </h3>
          <textarea
            value={freeWriting}
            onChange={onFreeWritingChange}
            className="w-full p-2 rounded bg-black/20 border border-white/10 text-white text-sm"
            rows={4}
            placeholder="اكتب هنا أفكارك ومشاعرك"
            dir="rtl"
          />
        </div>
      );
    }
