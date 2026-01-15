
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { polishText } from './services/geminiService';
import { PolishedResponse, HistoryItem, Tone } from './types';
import { 
  CheckCircle, 
  Copy, 
  Clock, 
  Trash2, 
  Send, 
  Sparkles, 
  Check, 
  ChevronRight,
  RefreshCcw,
  Type,
  Bold,
  Italic,
  List,
  Underline,
  MessageSquare,
  Briefcase,
  Coffee,
  ShieldCheck,
  Heart,
  Globe,
  FileText,
  X
} from 'lucide-react';

const TONES: { value: Tone, icon: any, desc: string }[] = [
  { value: 'Professional', icon: Briefcase, desc: 'Balanced & Expert' },
  { value: 'Formal', icon: ShieldCheck, desc: 'Traditional & Respectful' },
  { value: 'Casual', icon: Coffee, desc: 'Friendly & Relaxed' },
  { value: 'Assertive', icon: Send, desc: 'Direct & Decisive' },
  { value: 'Friendly', icon: Heart, desc: 'Warm & Approachable' },
  { value: 'Diplomatic', icon: Globe, desc: 'Tactful & Sensitive' },
];

const App: React.FC = () => {
  const [inputHtml, setInputHtml] = useState('');
  const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PolishedResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('editor_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('editor_history', JSON.stringify(history));
  }, [history]);

  // Word count calculation
  const wordCount = useMemo(() => {
    const text = inputHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
  }, [inputHtml]);

  // Sync contentEditable with state
  const handleInput = () => {
    if (editorRef.current) {
      setInputHtml(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handlePolish = async () => {
    const textToPolish = inputHtml.trim();
    if (!textToPolish || textToPolish === '<br>' || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await polishText(textToPolish, selectedTone);
      setResult(data);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        original: textToPolish,
        polished: data.polishedText,
        summary: data.summaryOfChanges,
        tone: selectedTone,
        timestamp: Date.now(),
      };
      
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (htmlContent: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const plainText = new Blob([htmlContent.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
    const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': plainText })];
    
    navigator.clipboard.write(data).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const clearHistory = () => {
    if (confirm("Clear all history?")) {
      setHistory([]);
      localStorage.removeItem('editor_history');
    }
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInputHtml(item.original);
    setSelectedTone(item.tone);
    if (editorRef.current) {
      editorRef.current.innerHTML = item.original;
    }
    setResult({ polishedText: item.polished, summaryOfChanges: item.summary });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetEditor = () => {
    setInputHtml('');
    setSelectedTone('Professional');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Elite Editor</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider">PROFESSIONAL COMMUNICATION COACH</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={resetEditor}
            className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100"
            title="Start New"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Tone Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" /> Select Desired Tone
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setSelectedTone(tone.value)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                    ${selectedTone === tone.value 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}
                  `}
                >
                  <tone.icon size={20} className={selectedTone === tone.value ? 'text-indigo-600' : 'text-slate-400'} />
                  <div className="text-center">
                    <p className="text-xs font-bold">{tone.value}</p>
                    <p className="text-[10px] opacity-70">{tone.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
            {/* Rich Text Toolbar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 flex-wrap">
              <button onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Bold"><Bold size={18} /></button>
              <button onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Italic"><Italic size={18} /></button>
              <button onClick={() => execCommand('underline')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Underline"><Underline size={18} /></button>
              <div className="w-px h-6 bg-slate-300 mx-1" />
              <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Bullet List"><List size={18} /></button>
              <div className="flex-1" />
              <div className="flex items-center gap-3 px-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold tracking-widest uppercase border-r border-slate-200 pr-3">
                  <FileText size={12} /> {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
                </span>
                <span className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">Targeting: {selectedTone}</span>
              </div>
            </div>

            {/* ContentEditable Area */}
            <div 
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              className="flex-1 p-8 text-slate-800 focus:outline-none overflow-y-auto leading-relaxed text-lg min-h-[300px]"
              style={{ minHeight: '300px' }}
              data-placeholder="Start typing or paste your draft here..."
            />
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400 italic">Tone & formatting preserved</span>
              <button
                onClick={handlePolish}
                disabled={isLoading || !inputHtml.trim() || inputHtml === '<br>'}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
                  ${isLoading || !inputHtml.trim() || inputHtml === '<br>'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95 shadow-indigo-200 shadow-md'}
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Context...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Polish Draft
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results / Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Polished Result */}
          {result ? (
            <div className="bg-white rounded-2xl shadow-md border border-indigo-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <CheckCircle size={18} /> {selectedTone} Polish
                </span>
                <button
                  onClick={() => handleCopy(result.polishedText)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
                  {copyFeedback ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-6 bg-white min-h-[200px]">
                <div 
                  className="text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-indigo-100 prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: result.polishedText }}
                />
              </div>
              <div className="p-5 bg-slate-50 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Coach's Improvements</h4>
                <ul className="space-y-2">
                  {result.summaryOfChanges.map((change, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-600">
                      <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="bg-white p-4 rounded-full shadow-sm text-slate-300 mb-4">
                <Type size={40} />
              </div>
              <h3 className="text-slate-600 font-semibold mb-1">Elite Analysis Waiting</h3>
              <p className="text-slate-400 text-sm max-w-[240px]">Select a tone and paste your draft to receive elite communication feedback.</p>
            </div>
          )}

          {/* History Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                <Clock size={16} /> Recent History
              </span>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                  title="Clear all history"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="relative group border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors pr-10"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                          {item.tone}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div 
                        className="text-sm text-slate-700 font-medium line-clamp-2 leading-snug overflow-hidden max-h-10"
                        dangerouslySetInnerHTML={{ __html: item.original }}
                      />
                    </button>
                    <button
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-50"
                      title="Delete entry"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  No previous drafts
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© 2024 Elite Editor & Communication Coach</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Multi-Tone Support Active</span>
            <span>Gemini-3 Pro Driven</span>
          </div>
        </div>
      </footer>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          cursor: text;
        }
      `}</style>
    </div>
  );
};

export default App;
