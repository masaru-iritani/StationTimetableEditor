import { useState, useEffect } from 'react';
import { Share2, RotateCcw, Trash2, Check } from 'lucide-react';
import { parseHash, serializeHash, getDefaultRows } from './utils/timetableState';
import type { TimetableRow } from './utils/timetableState';
import { TimetableGrid } from './components/TimetableGrid';

const LOCAL_STORAGE_KEY = 'station_timetable_editor_state_v1';

export default function App() {
  const [headers, setHeaders] = useState<string[]>(['']);
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Initialize state from URL hash or localStorage
  useEffect(() => {
    const handleInitialState = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const parsed = parseHash(hash);
        setHeaders(parsed.headers);
        setRows(parsed.rows);
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.headers && parsed.rows) {
              setHeaders(parsed.headers);
              setRows(parsed.rows);
              // Sync url hash on initial load from local storage
              window.location.hash = serializeHash(parsed.headers, parsed.rows);
              return;
            }
          } catch (e) {
            console.error('Failed to parse saved state:', e);
          }
        }
        // Fallback to default
        const defaultHeaders = ['のぼり（琴平方面）'];
        const defaultRows = getDefaultRows(1);
        setHeaders(defaultHeaders);
        setRows(defaultRows);
        window.location.hash = serializeHash(defaultHeaders, defaultRows);
      }
    };

    handleInitialState();

    // Listen for hash change (handles back/forward navigation or manual URL updates)
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const parsed = parseHash(hash);
        // Compare with current state to prevent endless loops
        const serializedCurrent = serializeHash(headers, rows);
        const serializedNew = serializeHash(parsed.headers, parsed.rows);
        if (serializedCurrent !== serializedNew) {
          setHeaders(parsed.headers);
          setRows(parsed.rows);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL hash and localStorage whenever headers or rows change
  const handleStateChange = (newHeaders: string[], newRows: TimetableRow[]) => {
    setHeaders(newHeaders);
    setRows(newRows);
    
    // Save to LocalStorage
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ headers: newHeaders, rows: newRows })
    );

    // Save to URL hash
    const newHash = serializeHash(newHeaders, newRows);
    // Only update hash if it's different to prevent layout jitters
    if (window.location.hash.slice(1) !== newHash) {
      window.location.hash = newHash;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleClearAll = () => {
    const emptyHeaders = ['Route 1'];
    const emptyRows = getDefaultRows(1);
    handleStateChange(emptyHeaders, emptyRows);
    setShowClearConfirm(false);
  };

  const handleResetToTsubojiri = () => {
    // A nice Easter Egg setting up the original station timetable in README
    const tsubojiriHeaders = ['のぼり（琴平方面）'];
    const tsubojiriRows = getDefaultRows(1).map(row => {
      // 7:02, 8:29, 12:33, 13:52, 17:01
      const updated = { ...row };
      if (row.hour === 7) updated.minutes = [['02']];
      else if (row.hour === 8) updated.minutes = [['29']];
      else if (row.hour === 12) updated.minutes = [['33']];
      else if (row.hour === 13) updated.minutes = [['52']];
      else if (row.hour === 17) updated.minutes = [['01']];
      return updated;
    });
    handleStateChange(tsubojiriHeaders, tsubojiriRows);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      
      {/* Top Banner/Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Station Timetable Editor
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Modern PWA Timetable Authoring Tool
              </p>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? 'Copied Link!' : 'Copy Share Link'}</span>
            </button>

            <button
              onClick={handleResetToTsubojiri}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-800 cursor-pointer"
              title="Load original Tsubojiri station demo timetable"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Demo Timetable</span>
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-1 bg-slate-900 border border-red-900/50 p-1 rounded-xl">
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/45 hover:text-red-400 text-red-500 text-xs font-semibold rounded-xl border border-red-500/10 transition-all cursor-pointer"
                title="Reset editor to empty timetable"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear Grid</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Intro Info Banner */}
        <section className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 z-10 max-w-2xl">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Real-time URL Synchronization
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every edit you make to columns, hours, or scheduled departure minutes updates the URL hash in real-time. Simply copy the URL to share the state of the timetable or bookmark it for future use.
            </p>
          </div>
          
          <div className="flex gap-4 shrink-0 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl w-full md:w-auto">
            <div className="flex flex-col items-center flex-1 md:flex-initial">
              <span className="text-2xl font-extrabold text-indigo-400 font-mono">{headers.length}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Routes</span>
            </div>
            <div className="w-px bg-slate-800 align-stretch"></div>
            <div className="flex flex-col items-center flex-1 md:flex-initial">
              <span className="text-2xl font-extrabold text-indigo-400 font-mono">{rows.length}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Hours</span>
            </div>
            <div className="w-px bg-slate-800 align-stretch"></div>
            <div className="flex flex-col items-center flex-1 md:flex-initial">
              <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                {rows.reduce((sum, r) => sum + r.minutes.reduce((s, m) => s + m.length, 0), 0)}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Departures</span>
            </div>
          </div>
        </section>

        {/* Timetable Table Grid */}
        <section className="space-y-2">
          <TimetableGrid
            headers={headers}
            rows={rows}
            onChange={handleStateChange}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p>Station Timetable Editor — Fully Offline-Capable PWA Application</p>
            <p className="mt-1 text-slate-600">
              Co-authored by Masaru Iritani, Antigravity AI, and <a href="https://www.openai.com/chatgpt" className="text-slate-500 hover:text-indigo-400 underline transition-all">ChatGPT</a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-slate-900 border border-slate-800/80 rounded-md text-[10px] uppercase font-mono tracking-wider text-slate-400">
              v1.0.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
