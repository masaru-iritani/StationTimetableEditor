import { useState, useEffect, useRef } from 'react';
import { Edit2, Check } from 'lucide-react';

interface EditableHeaderProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
}

export const EditableHeader: React.FC<EditableHeaderProps> = ({
  value,
  onSave,
  placeholder = 'Route Name',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    onSave(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1.5 px-2 py-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="w-full text-center bg-slate-950/80 text-sm font-semibold border border-indigo-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600"
        />
        <button 
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          className="text-emerald-400 hover:text-emerald-300 p-1"
        >
          <Check size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="group relative flex items-center justify-center gap-1.5 cursor-pointer py-2 px-4 rounded-xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800/40"
    >
      <span className={`text-sm font-semibold tracking-wide ${value ? 'text-slate-200' : 'text-slate-500 italic'}`}>
        {value || placeholder}
      </span>
      <Edit2 
        size={13} 
        className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0" 
      />
    </div>
  );
};
