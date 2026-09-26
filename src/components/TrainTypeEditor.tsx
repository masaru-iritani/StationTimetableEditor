import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { TrainType } from '../utils/timetableState';

interface TrainTypeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  trainTypes: TrainType[];
  onSave: (trainTypes: TrainType[]) => void;
}

export const TrainTypeEditor: FC<TrainTypeEditorProps> = ({
  isOpen,
  onClose,
  trainTypes,
  onSave,
}) => {
  const [types, setTypes] = useState<TrainType[]>([]);
  const [charInput, setCharInput] = useState('');
  const [colorInput, setColorInput] = useState('#ff0000');
  const [error, setError] = useState('');

  const [descriptionInput, setDescriptionInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      setTypes([...trainTypes]);
      setCharInput('');
      setColorInput('#ff0000');
      setDescriptionInput('');
      setError('');
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen, trainTypes]);

  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmedChar = charInput.trim();
    if (!trimmedChar) {
      setError('Character cannot be empty.');
      return;
    }
    if (types.some(t => t.char === trimmedChar)) {
      setError('This character is already used.');
      return;
    }
    
    setTypes([...types, { char: trimmedChar, color: colorInput, description: descriptionInput.trim() }]);
    setCharInput('');
    setDescriptionInput('');
    setError('');
  };

  const handleRemove = (char: string) => {
    setTypes(types.filter(t => t.char !== char));
  };

  const handleSave = () => {
    onSave(types);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h3 className="text-lg font-semibold text-slate-100">Manage Train Types</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/50">
            <X size={18} />
          </button>
        </div>

        <div className="my-6">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Existing Types
          </label>
          {types.length === 0 ? (
            <div className="text-sm text-slate-500 italic py-3 bg-slate-950/30 border border-dashed border-slate-800/50 rounded-xl text-center">
              No train types defined
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {types.map(t => (
                <div key={t.char} className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md shadow-sm border border-slate-700" style={{ backgroundColor: t.color }}></div>
                      <span className="text-sm font-medium text-slate-200">
                        Char: <span className="font-bold text-lg ml-1" style={{ color: t.color }}>{t.char}</span>
                      </span>
                    </div>
                    <button onClick={() => handleRemove(t.char)} aria-label={`Remove train type ${t.char}`} title={`Remove ${t.char}`} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {t.description && (
                    <div className="text-xs text-slate-400 pl-9">
                      {t.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
              Add New Type
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Char"
                  value={charInput}
                  onChange={(e) => {
                    setCharInput(e.target.value);
                    setError('');
                  }}
                  maxLength={2}
                  className="w-20 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-12 h-[42px] p-1 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 font-medium flex items-center justify-center transition-colors mt-1"
              >
                <Plus size={18} className="mr-1" /> Add
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        </div>

        <div className="mt-8 flex gap-3 border-t border-slate-800/80 pt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
