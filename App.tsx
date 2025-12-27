
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Role } from './types.ts';
import { Artifact, validateImportData } from './lib/schemas.ts';
import { callSovereignEngineer } from './services/geminiService.ts';
import Terminal from './components/Terminal.tsx';
import ArtifactDisplay from './components/ArtifactDisplay.tsx';
import CapabilitiesDisplay from './components/CapabilitiesDisplay.tsx';
import SovereignButton from './components/atoms/SovereignButton.tsx';

type ViewState = 'terminal' | 'artifacts' | 'capabilities' | 'info';
type ThemeMode = 'dark' | 'sepia' | 'light';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastModelResponse, setLastModelResponse] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('terminal');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('sovereign_theme') as ThemeMode;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
    localStorage.setItem('sovereign_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'sepia';
      if (prev === 'sepia') return 'light';
      return 'dark';
    });
  };

  useEffect(() => {
    const savedManifest = localStorage.getItem('sovereign_manifest');
    if (savedManifest) {
      try {
        const parsed = JSON.parse(savedManifest);
        const { valid, data } = validateImportData(parsed);
        if (valid && data) setArtifacts(data);
      } catch (e) {
        console.error("Local manifest recovery failed.");
      }
    }
  }, []);

  useEffect(() => {
    if (artifacts.length > 0) {
      localStorage.setItem('sovereign_manifest', JSON.stringify(artifacts));
    }
  }, [artifacts]);

  const handleExport = () => {
    const dataStr = JSON.stringify(artifacts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `grid9-manifest-${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setIsMenuOpen(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const { valid, data } = validateImportData(parsed);
        if (valid && data) {
          setArtifacts(data);
          setIsMenuOpen(false);
        } else {
          alert("Manifest Rejected.");
        }
      } catch (err) {
        alert("Injection Failure.");
      }
    };
    reader.readAsText(file);
  };

  const handleStopQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: "NEURAL LINK INTERRUPTED.",
        timestamp: Date.now(),
      }]);
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string, imageData?: { data: string, mimeType: string }, isInitial = false) => {
    if (!isInitial) {
      setMessages(prev => [...prev, {
        role: Role.USER,
        text,
        timestamp: Date.now(),
        imageData,
      }]);
    }
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const history = messages.map(m => ({
        role: m.role === Role.USER ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: m.text }]
      }));

      const responseText = await callSovereignEngineer(isInitial ? "Establish handshake." : text, history, imageData);
      
      if (!abortControllerRef.current) return;

      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now(),
      }]);
      setLastModelResponse(responseText);
      
      if (!isInitial && responseText.includes('```')) {
        setTimeout(() => setActiveView('artifacts'), 500);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: Role.MODEL,
          text: "CRITICAL: Logic Bridge Fault.",
          timestamp: Date.now(),
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      handleSendMessage("", undefined, true);
    }
  }, [handleSendMessage]);

  const navItems = [
    { id: 'terminal', label: 'Console' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'info', label: 'System' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="py-4 md:py-6 px-6 md:px-8 flex items-center justify-between z-40 shadow-2xl border-b-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center space-x-4 md:space-x-6">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl transition-colors hover:bg-black/20"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Toggle Neural Menu"
          >
            {isMenuOpen ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
          
          <div className="flex items-center space-x-3 md:space-x-5">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-white shadow-xl text-xl md:text-3xl" style={{ backgroundColor: 'var(--accent-primary)' }}>Σ</div>
            <div className="leading-none">
              <h1 className="text-xl md:text-3xl font-black tracking-tighter uppercase" style={{ color: 'var(--text-primary)' }}>Grid-9 Engineer</h1>
              <p className="hidden md:block text-xs font-mono uppercase tracking-[0.4em] mt-1" style={{ color: 'var(--accent-primary)' }}>ARCH: TENSOR G4 // {theme.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-2 p-2 rounded-2xl border" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'var(--border-primary)' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewState)}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                  activeView === item.id ? 'shadow-lg' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: activeView === item.id ? 'var(--accent-primary)' : 'transparent',
                  color: activeView === item.id ? 'white' : 'var(--text-primary)'
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center space-x-2 ml-4 border-l-2 pl-4" style={{ borderColor: 'var(--border-primary)' }}>
            <SovereignButton onClick={toggleTheme} variant="ghost" size="sm" className="font-mono">
              {theme}
            </SovereignButton>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <SovereignButton onClick={() => fileInputRef.current?.click()} variant="ghost" size="sm">
              Import
            </SovereignButton>
            <SovereignButton onClick={handleExport} variant="govern" size="sm">
              Export
            </SovereignButton>
          </div>

          <SovereignButton onClick={toggleTheme} variant="ghost" size="sm" className="md:hidden font-mono text-[10px]">
            {theme}
          </SovereignButton>
        </div>
      </header>

      {/* Mobile Neural Drawer */}
      <div className={`fixed inset-0 z-30 transition-all duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute left-0 top-0 bottom-0 w-4/5 shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} sovereign-card border-r-2`} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex items-center space-x-4 pb-8 border-b-2" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl" style={{ backgroundColor: 'var(--accent-primary)' }}>Σ</div>
              <div className="font-black uppercase tracking-tighter">Grid-9 Menu</div>
            </div>

            <nav className="space-y-4 flex-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as ViewState);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-5 rounded-2xl text-sm font-black uppercase transition-all flex items-center justify-between ${
                    activeView === item.id ? 'shadow-xl' : 'opacity-60'
                  }`}
                  style={{ 
                    backgroundColor: activeView === item.id ? 'var(--accent-primary)' : 'rgba(0,0,0,0.1)',
                    color: activeView === item.id ? 'white' : 'var(--text-primary)'
                  }}
                >
                  {item.label}
                  {activeView === item.id && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                </button>
              ))}
            </nav>

            <div className="space-y-4 pt-8 border-t-2" style={{ borderColor: 'var(--border-primary)' }}>
              <SovereignButton onClick={() => fileInputRef.current?.click()} variant="ghost" size="md" className="w-full">
                Import Protocol
              </SovereignButton>
              <SovereignButton onClick={handleExport} variant="govern" size="md" className="w-full">
                Export Manifest
              </SovereignButton>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-500 ${activeView === 'terminal' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="h-full p-4 md:p-12 max-w-[1400px] mx-auto">
            <Terminal messages={messages} onSendMessage={handleSendMessage} onStopQuery={handleStopQuery} isLoading={isLoading} />
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-500 ${activeView === 'capabilities' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="h-full overflow-y-auto">
            <CapabilitiesDisplay />
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-500 ${activeView === 'artifacts' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="h-full">
            <ArtifactDisplay artifacts={artifacts} onArtifactsUpdate={setArtifacts} lastResponse={lastModelResponse} />
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-500 ${activeView === 'info' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <div className="h-full p-6 md:p-20 overflow-y-auto max-w-6xl mx-auto">
             <div className="rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-3xl sovereign-card">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8 md:mb-10">System Status</h2>
                <div className="space-y-6 font-mono text-sm md:text-base">
                  <div className="flex justify-between border-b pb-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <span>Persistence Layer</span>
                    <span className="sovereign-text-accent">Active</span>
                  </div>
                  <div className="flex justify-between border-b pb-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <span>Artifact Count</span>
                    <span style={{ color: 'var(--accent-secondary)' }}>{artifacts.length} Active Records</span>
                  </div>
                  <div className="flex justify-between border-b pb-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <span>Neural Model</span>
                    <span>Gemini 3 Pro</span>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </main>

      <footer className="border-t-2 py-4 px-6 md:px-12 flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
        <div className="flex items-center sovereign-text-accent">
          <span className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 md:mr-3 animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
          <span className="hidden xs:inline">SYNC STATUS: SECURE</span>
          <span className="xs:hidden">SECURE</span>
        </div>
        <div className="flex space-x-4 md:space-x-8">
           <span>Σ-GRID9 v2.4.0</span>
           <span className="opacity-40 hidden sm:inline">PIXEL 9 // TENSOR G4</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
