import { useState, useEffect, useRef } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react';
import type { TrainType } from '../utils/timetableState';

interface EditableTrainType extends TrainType {
  id: string;
  originalChar?: string;
}

interface TrainTypeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  trainTypes: TrainType[];
  onSave: (trainTypes: TrainType[], renameMap?: Map<string, string>) => void;
}

export const TrainTypeEditor: FC<TrainTypeEditorProps> = ({
  isOpen,
  onClose,
  trainTypes,
  onSave,
}) => {
  const [types, setTypes] = useState<EditableTrainType[]>([]);
  const [charInput, setCharInput] = useState('');
  const [colorInput, setColorInput] = useState('#ff0000');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [error, setError] = useState('');

  // Editing state for an existing train type
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editChar, setEditChar] = useState('');
  const [editColor, setEditColor] = useState('#ff0000');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const editCharRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      setTypes(
        trainTypes.map((t, idx) => ({
          ...t,
          id: `tt-${idx}-${t.char}`,
          originalChar: t.char,
        }))
      );
      setCharInput('');
      setColorInput('#ff0000');
      setDescriptionInput('');
      setError('');
      setEditingIndex(null);
      setEditError('');
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen, trainTypes]);

  useEffect(() => {
    if (editingIndex !== null) {
      editCharRef.current?.focus();
      editCharRef.current?.select();
    }
  }, [editingIndex]);

  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmedChar = charInput.trim();
    if (!trimmedChar) {
      setError('Character cannot be empty.');
      return;
    }
    if (/[:,;#|[\]]/.test(trimmedChar)) {
      setError('Character cannot contain :, ;, ,, |, #, or [].');
      return;
    }
    if (types.some(t => t.char === trimmedChar)) {
      setError('This character is already used.');
      return;
    }
    
    setTypes([
      ...types,
      {
        char: trimmedChar,
        color: colorInput,
        description: descriptionInput.trim() || undefined,
        id: `tt-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    ]);
    setCharInput('');
    setDescriptionInput('');
    setError('');
  };

  const handleStartEdit = (index: number) => {
    const t = types[index];
    setEditingIndex(index);
    setEditChar(t.char);
    setEditColor(t.color);
    setEditDescription(t.description || '');
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditError('');
  };

  const validateAndGetEditedType = (): TrainType | null => {
    if (editingIndex === null) return null;
    const trimmedChar = editChar.trim();
    if (!trimmedChar) {
      setEditError('Character cannot be empty.');
      return null;
    }
    if (/[:,;#|[\]]/.test(trimmedChar)) {
      setEditError('Character cannot contain :, ;, ,, |, #, or [].');
      return null;
    }
    if (types.some((t, idx) => idx !== editingIndex && t.char === trimmedChar)) {
      setEditError('This character is already used.');
      return null;
    }
    return {
      char: trimmedChar,
      color: editColor,
      description: editDescription.trim() || undefined,
    };
  };

  const getSavedTypesWithCurrentEdit = (): EditableTrainType[] | null => {
    if (editingIndex === null) return types;
    const edited = validateAndGetEditedType();
    if (!edited) return null;
    const next = [...types];
    next[editingIndex] = {
      ...next[editingIndex],
      ...edited,
    };
    return next;
  };

  const handleSaveEdit = () => {
    const updated = getSavedTypesWithCurrentEdit();
    if (!updated) return;
    setTypes(updated);
    setEditingIndex(null);
    setEditError('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleRemove = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditError('');
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    setTypes(types.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    let currentTypes = types;
    if (editingIndex !== null) {
      const saved = getSavedTypesWithCurrentEdit();
      if (!saved) return;
      currentTypes = saved;
    }

    const renameMap = new Map<string, string>();
    for (const t of currentTypes) {
      if (t.originalChar && t.originalChar !== t.char) {
        renameMap.set(t.originalChar, t.char);
      }
    }

    const cleanTypes: TrainType[] = currentTypes.map(({ char, color, description }) => ({
      char,
      color,
      ...(description ? { description } : {}),
    }));

    onSave(cleanTypes, renameMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass-panel relative w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h3 className="text-lg font-semibold text-slate-100">Manage Train Types</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer">
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
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {types.map((t, index) => {
                const isEditing = editingIndex === index;

                if (isEditing) {
                  return (
                    <div key={t.id} className="flex flex-col gap-2 bg-slate-900/90 border border-indigo-500/70 rounded-xl p-3 shadow-lg">
                      <div className="flex gap-2 items-center">
                        <input
                          ref={editCharRef}
                          type="text"
                          placeholder="Char"
                          value={editChar}
                          onChange={(e) => {
                            setEditChar(e.target.value);
                            setEditError('');
                          }}
                          onKeyDown={handleEditKeyDown}
                          maxLength={2}
                          aria-label="Character"
                          className="w-16 bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm font-bold"
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          aria-label="Color"
                          className="w-11 h-[38px] p-1 bg-slate-950/80 border border-slate-700 rounded-xl cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          aria-label="Description"
                          className="flex-1 min-w-0 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                      {editError && <p className="text-xs text-red-400">{editError}</p>}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                        >
                          <Check size={14} /> Update
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={t.id} className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md shadow-sm border border-slate-700" style={{ backgroundColor: t.color }}></div>
                        <span className="text-sm font-medium text-slate-200">
                          Char: <span className="font-bold text-lg ml-1" style={{ color: t.color }}>{t.char}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index)}
                          aria-label={`Edit train type ${t.char}`}
                          title={`Edit ${t.char}`}
                          className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          aria-label={`Remove train type ${t.char}`}
                          title={`Remove ${t.char}`}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {t.description && (
                      <div className="text-xs text-slate-400 pl-9">
                        {t.description}
                      </div>
                    )}
                  </div>
                );
              })}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    }
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 font-medium flex items-center justify-center transition-colors mt-1 cursor-pointer"
              >
                <Plus size={18} className="mr-1" /> Add
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        </div>

        <div className="mt-8 flex gap-3 border-t border-slate-800/80 pt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

