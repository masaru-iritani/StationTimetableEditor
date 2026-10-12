import { useState, useEffect, useRef } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { Edit2, Check, Trash2 } from 'lucide-react';

interface EditableHeaderProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  onDelete?: () => void;
}

export const EditableHeader: FC<EditableHeaderProps> = ({
  value,
  onSave,
  placeholder = 'Route Name',
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setInputValue(value), 0);
    return () => clearTimeout(id);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    // Prevent saving an empty route name — restore the previous value instead
    if (trimmed === '') {
      setInputValue(value);
      setIsEditing(false);
      return;
    }
    onSave(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.altKey) {
      // Alt+Enter: insert a newline at the cursor position
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = inputValue.slice(0, start) + '\n' + inputValue.slice(end);
      setInputValue(next);
      // Restore cursor after the inserted newline on next render
      requestAnimationFrame(() => {
        el.selectionStart = start + 1;
        el.selectionEnd = start + 1;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1.5 px-2 py-1">
        <textarea
          ref={textareaRef}
          rows={2}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          title="Alt+Enter to insert a new line"
          className="w-full text-center bg-slate-950/80 text-sm font-semibold border border-indigo-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 resize-none leading-snug"
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          aria-label="Save route name"
          className="text-emerald-400 hover:text-emerald-300 p-1"
        >
          <Check size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="group/name relative flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 print:p-0 print:border-none print:shadow-none print:cursor-default print:hover:bg-transparent"
        title="Edit route name"
      >
        <span className={`text-sm font-semibold tracking-wide whitespace-pre-line text-center ${value ? 'text-slate-200' : 'text-slate-500 italic'} print:text-slate-900 print:text-base print:font-bold`}>
          {value || placeholder}
        </span>
        <Edit2
          size={13}
          className="text-slate-500 group-hover/name:text-indigo-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 shrink-0 print:hidden"
        />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete route column"
          title="Delete route column"
          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-all duration-200 shrink-0 cursor-pointer print:hidden"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};
