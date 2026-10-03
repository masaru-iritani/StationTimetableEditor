import { useState, useEffect, useRef } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import type { TrainType, Destination } from '../utils/timetableState';
import { parseDeparture, formatDeparture } from '../utils/timetableState';

interface EditMinutesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hour: number;
  routeName: string;
  minutes: string[];
  trainTypes: TrainType[];
  destinations: Destination[];
  onSave: (newMinutes: string[]) => void;
}

export const EditMinutesDialog: FC<EditMinutesDialogProps> = ({
  isOpen,
  onClose,
  hour,
  routeName,
  minutes,
  trainTypes,
  destinations,
  onSave,
}) => {
  const [currentMinutes, setCurrentMinutes] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedTrainType, setSelectedTrainType] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      setCurrentMinutes(
        [...minutes].sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b))
      );
      setInputValue('');
      setSelectedTrainType('');
      setSelectedDestination('');
      setError('');
      // Focus input after modal transition
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen, minutes]);

  if (!isOpen) return null;

  const handleAddMinute = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    const match = trimmed.match(/^(\d+)(.*)$/);
    if (!match) {
      setError('Must start with a minute number (e.g. 05 or 15).');
      return;
    }

    const parsed = parseInt(match[1], 10);
    if (parsed < 0 || parsed > 59) {
      setError('Minutes must be between 00 and 59.');
      return;
    }

    const numStr = parsed.toString().padStart(2, '0');
    let tChar = selectedTrainType;
    let dChar = selectedDestination;
    if (match[2]) {
      const parsedDeparture = parseDeparture(trimmed, trainTypes, destinations);
      if (parsedDeparture.trainType) tChar = parsedDeparture.trainType;
      if (parsedDeparture.destination) dChar = parsedDeparture.destination;
    }

    const formatted = formatDeparture(numStr, tChar, dChar);
    if (currentMinutes.includes(formatted)) {
      setError('This departure is already scheduled.');
      return;
    }

    const updated = [...currentMinutes, formatted].sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b)
    );
    setCurrentMinutes(updated);
    setInputValue('');
    setError('');
    inputRef.current?.focus();
  };

  const handleUpdateMinuteTrainType = (oldMin: string, newTypeChar: string) => {
    const info = parseDeparture(oldMin, trainTypes, destinations);
    const newMin = formatDeparture(info.minute, newTypeChar, info.destination);
    if (newMin === oldMin) return;
    if (currentMinutes.includes(newMin)) {
      setError(`Departure is already scheduled.`);
      return;
    }
    const updated = currentMinutes
      .map((m) => (m === oldMin ? newMin : m))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
    setCurrentMinutes(updated);
    setError('');
  };

  const handleUpdateMinuteDestination = (oldMin: string, newDestChar: string) => {
    const info = parseDeparture(oldMin, trainTypes, destinations);
    const newMin = formatDeparture(info.minute, info.trainType, newDestChar);
    if (newMin === oldMin) return;
    if (currentMinutes.includes(newMin)) {
      setError(`Departure is already scheduled.`);
      return;
    }
    const updated = currentMinutes
      .map((m) => (m === oldMin ? newMin : m))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
    setCurrentMinutes(updated);
    setError('');
  };

  const handleRemoveMinute = (minuteToRemove: string) => {
    const updated = currentMinutes.filter((m) => m !== minuteToRemove);
    setCurrentMinutes(updated);
  };

  const handleSave = () => {
    onSave(currentMinutes);
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMinute(inputValue);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const activeLabels: string[] = [];
  if (selectedTrainType) activeLabels.push(`Type: ${selectedTrainType}`);
  if (selectedDestination) activeLabels.push(`Dest: ${selectedDestination}`);
  const activeLabelText = activeLabels.length > 0 ? ` (${activeLabels.join(', ')})` : '';

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
            aria-label="Close"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer"
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
            <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {currentMinutes.map((min) => {
                const { minute: numStr, trainType: tChar, destination: dChar } = parseDeparture(
                  min,
                  trainTypes,
                  destinations
                );
                const trainType = trainTypes.find((t) => t.char === tChar);

                return (
                  <div 
                    key={min} 
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl font-medium transition-all shadow-sm"
                  >
                    <div className="relative inline-flex items-start">
                      <span 
                        className="text-xl font-bold font-mono" 
                        style={{ color: trainType ? trainType.color : undefined }}
                      >
                        {numStr}
                      </span>
                      {dChar && (
                        <span className="text-[10px] leading-none font-sans font-medium text-slate-300 ml-0.5 pt-0.5 select-none">
                          {dChar}
                        </span>
                      )}
                    </div>

                    {trainTypes.length > 0 ? (
                      <select
                        value={tChar}
                        onChange={(e) => handleUpdateMinuteTrainType(min, e.target.value)}
                        aria-label={`Train type for minute ${numStr}`}
                        className="text-xs bg-slate-950/80 border border-slate-700 rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans"
                        style={{ color: trainType ? trainType.color : undefined }}
                      >
                        <option value="" className="text-slate-300 bg-slate-900">Type: None</option>
                        {trainTypes.map((t) => (
                          <option key={t.char} value={t.char} className="text-slate-200 bg-slate-900">
                            {t.char}{t.description ? ` (${t.description})` : ''}
                          </option>
                        ))}
                        {tChar && !trainTypes.some((t) => t.char === tChar) && (
                          <option value={tChar} className="text-slate-200 bg-slate-900">
                            {tChar}
                          </option>
                        )}
                      </select>
                    ) : (
                      tChar && <span className="text-xs text-indigo-300 font-sans">{tChar}</span>
                    )}

                    {destinations.length > 0 ? (
                      <select
                        value={dChar}
                        onChange={(e) => handleUpdateMinuteDestination(min, e.target.value)}
                        aria-label={`Destination for minute ${numStr}`}
                        className="text-xs bg-slate-950/80 border border-slate-700 rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans text-slate-200"
                      >
                        <option value="" className="text-slate-300 bg-slate-900">Dest: None</option>
                        {destinations.map((d) => (
                          <option key={d.char} value={d.char} className="text-slate-200 bg-slate-900">
                            {d.char}{d.description ? ` (${d.description})` : ''}
                          </option>
                        ))}
                        {dChar && !destinations.some((d) => d.char === dChar) && (
                          <option value={dChar} className="text-slate-200 bg-slate-900">
                            {dChar}
                          </option>
                        )}
                      </select>
                    ) : (
                      dChar && <span className="text-xs text-slate-400 font-sans">[{dChar}]</span>
                    )}

                    <button 
                      onClick={() => handleRemoveMinute(min)}
                      aria-label={`Remove ${min}`}
                      className="text-slate-400 hover:text-red-400 transition-colors p-0.5 rounded-lg hover:bg-slate-700/50 ml-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="space-y-4">
          {trainTypes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Train Type
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Train Type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTrainType === ''}
                  onClick={() => setSelectedTrainType('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedTrainType === ''
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>None</span>
                </button>
                {trainTypes.map((t) => {
                  const isSelected = selectedTrainType === t.char;
                  return (
                    <button
                      key={t.char}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedTrainType(t.char)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-bold text-sm" style={{ color: t.color }}>{t.char}</span>
                      {t.description && (
                        <span className="text-slate-400 text-xs truncate max-w-[120px]">
                          {t.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {destinations.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Destination
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Destination">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedDestination === ''}
                  onClick={() => setSelectedDestination('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDestination === ''
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>None</span>
                </button>
                {destinations.map((d) => {
                  const isSelected = selectedDestination === d.char;
                  return (
                    <button
                      key={d.char}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedDestination(d.char)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="font-bold text-sm text-slate-200">{d.char}</span>
                      {d.description && (
                        <span className="text-slate-400 text-xs truncate max-w-[120px]">
                          {d.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="minute-input" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Add Minute (00 - 59)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                ref={inputRef}
                id="minute-input"
                type="text"
                placeholder={
                  activeLabelText
                    ? `e.g. 05${activeLabelText}`
                    : 'e.g. 05 or 15'
                }
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
              <button
                onClick={() => handleAddMinute(inputValue)}
                aria-label="Add minute"
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl px-4 py-2 font-medium flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
              Quick Add{activeLabelText}
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {['00', '05', '10', '15', '20', '30', '40', '45', '50', '55'].map((quickVal) => (
                <button
                  key={quickVal}
                  type="button"
                  onClick={() => handleAddMinute(quickVal)}
                  className="py-1 bg-slate-950/40 hover:bg-slate-800/80 active:bg-indigo-600 active:text-white text-xs font-medium border border-slate-800/60 rounded-lg text-slate-300 font-mono transition-all cursor-pointer"
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
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

