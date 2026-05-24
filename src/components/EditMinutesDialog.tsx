import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';

interface EditMinutesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hour: number;
  routeName: string;
  minutes: string[];
  onSave: (newMinutes: string[]) => void;
}

export const EditMinutesDialog: React.FC<EditMinutesDialogProps> = ({
  isOpen,
  onClose,
  hour,
  routeName,
  minutes,
  onSave,
}) => {
  const [currentMinutes, setCurrentMinutes] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMinutes([...minutes].sort((a, b) => parseInt(a) - parseInt(b)));
      setInputValue('');
      setError('');
      // Focus input after modal transition
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, minutes]);

  if (!isOpen) return null;

  const handleAddMinute = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 59) {
      setError('Minutes must be between 00 and 59.');
      return;
    }

    const formatted = parsed.toString().padStart(2, '0');
    if (currentMinutes.includes(formatted)) {
      setError('This minute is already added.');
      return;
    }

    const updated = [...currentMinutes, formatted].sort((a, b) => parseInt(a) - parseInt(b));
    setCurrentMinutes(updated);
    setInputValue('');
    setError('');
    inputRef.current?.focus();
  };

  const handleRemoveMinute = (minuteToRemove: string) => {
    const updated = currentMinutes.filter((m) => m !== minuteToRemove);
    setCurrentMinutes(updated);
  };

  const handleSave = () => {
    onSave(currentMinutes);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMinute(inputValue);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Dialog container */}
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-2xl transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Edit Departures</h3>
            <p className="text-xs text-indigo-400 mt-0.5">
              Hour {hour}:00 — {routeName || 'Unnamed Route'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Departure List */}
        <div className="my-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Scheduled Minutes
          </label>
          {currentMinutes.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500 italic py-3 bg-slate-950/30 border border-dashed border-slate-800/50 rounded-xl text-center">
              No departures scheduled for this hour
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {currentMinutes.map((min) => (
                <div 
                  key={min} 
                  className="group inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm font-medium transition-all"
                >
                  <span>{min}</span>
                  <button 
                    onClick={() => handleRemoveMinute(min)}
                    className="text-indigo-400 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="minute-input" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Add Minute (00 - 59)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                ref={inputRef}
                id="minute-input"
                type="number"
                min="0"
                max="59"
                placeholder="e.g. 05"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
              <button
                onClick={() => handleAddMinute(inputValue)}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl px-4 py-2 font-medium flex items-center justify-center transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
          </div>

          {/* Quick options for touch devices */}
          <div className="pt-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-2">
              Quick Add
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {['00', '05', '10', '15', '20', '30', '40', '45', '50', '55'].map((quickVal) => (
                <button
                  key={quickVal}
                  onClick={() => handleAddMinute(quickVal)}
                  className="py-1 bg-slate-950/40 hover:bg-slate-800/80 active:bg-indigo-600 active:text-white text-xs font-medium border border-slate-800/60 rounded-lg text-slate-300 font-mono transition-all"
                >
                  +{quickVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex gap-3 border-t border-slate-800/80 pt-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
