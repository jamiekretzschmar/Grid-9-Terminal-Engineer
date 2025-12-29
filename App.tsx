
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Role, SystemState } from './types.ts';
import { Artifact, validateImportData } from './lib/schemas.ts';
import { callSovereignEngineer, generateLogo, NeuralAuthError } from './services/geminiService.ts';
import Terminal from './components/Terminal.tsx';
import ArtifactDisplay from './components/ArtifactDisplay.tsx';
import CapabilitiesDisplay from './components/CapabilitiesDisplay.tsx';
import SovereignButton from './components/atoms/SovereignButton.tsx';
import { 
  ShieldAlert, 
  Zap, 
  Menu, 
  X, 
  Terminal as TerminalIcon, 
  Cpu, 
  FileCode, 
  Settings, 
  Download, 
  Upload,
  Palette,
  Sparkles,
  Loader2
} from 'lucide-react';

type ViewState = 'terminal' | 'artifacts' | 'capabilities' | 'info';
type ThemeMode = 'dark' | 'sepia' | 'light';

const DEFAULT_SYSTEM_STATE: SystemState = {
  isInitialized: false,
  termuxInfo: null,
  architecture: null,
  androidVersion: null,
  isRooted: false,
};

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [systemState, setSystemState] = useState<SystemState>(DEFAULT_SYSTEM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [lastModelResponse, setLastModelResponse] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('terminal');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState("");
  
  const initialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('sovereign_theme') as ThemeMode;
    if (savedTheme) setTheme(savedTheme);
    const savedLogo = localStorage.getItem('sovereign_logo');
    if (savedLogo) setLogoUrl(savedLogo);
  }, []);

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
    localStorage.setItem('sovereign_theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedState = localStorage.getItem('sovereign_system_state');
    if (savedState) {
      try {
        setSystemState(JSON.parse(savedState));
      } catch (e) {
        console.error("Failed to load system state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sovereign_system_state', JSON.stringify(systemState));
  }, [systemState]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'sepia';
      if (prev === 'sepia') return 'light';
      return 'dark';
    });
  };

  const handleOpenAuth = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        setAuthError(null);
        if (messages.length === 0) {
          handleSendMessage("", undefined, true);
        }
      }
    } catch (err) {
      console.error("Auth dialog failed", err);
    }
  };

  const handleGenerateBranding = async () => {
    if (isGeneratingLogo) return;
    
    // Nano Banana 3 (Gemini 3 Pro Image) requires API key check
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsGeneratingLogo(true);
    const steps = [
      "Initializing Foil Stamping Protocol...",
      "Marshalling #c43333 Pigment Buffers...",
      "Applying Tensor G4 Geometric Constraints...",
      "Polishing High-Contrast Motifs...",
      "Finalizing Neural Sigil..."
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      setGenerationStep(steps[stepIndex % steps.length]);
      stepIndex++;
    }, 4000);

    try {
      const url = await generateLogo();
      setLogoUrl(url);
      localStorage.setItem('sovereign_logo', url);
      setAuthError(null);
    } catch (error: any) {
      if (error instanceof NeuralAuthError) {
        setAuthError(error.message);
      } else {
        alert("Fabrication Error: Bridge disconnected during logo generation.");
      }
    } finally {
      clearInterval(interval);
      setIsGeneratingLogo(false);
      setGenerationStep("");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ artifacts, systemState }, null, 2);
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
        const artifactData = parsed.artifacts || parsed;
        const { valid, data } = validateImportData(artifactData);
        if (valid && data) {
          setArtifacts(data);
          if (parsed.systemState) setSystemState(parsed.systemState);
          setIsMenuOpen(false);
        } else {
          alert("Integrity Violation: Manifest Rejected.");
        }
      } catch (err) {
        alert("Injection Failure: Malformed JSON.");
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
      setAuthError(null);
      
      if (!isInitial && responseText.includes('```')) {
        setTimeout(() => setActiveView('artifacts'), 500);
      }
    } catch (error: any) {
      if (error instanceof NeuralAuthError) {
        setAuthError(error.message);
      } else if (error.name !== 'AbortError') {
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
    { id: 'terminal', label: 'Console', icon: TerminalIcon },
    { id: 'capabilities', label: 'Lattice', icon: Cpu },
    { id: 'artifacts', label: 'Governance', icon: FileCode },
    { id: 'info', label: 'Registry', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="h-20 md:h-24 px-6 md:px-10 flex items-center justify-between z-40 shadow-2xl border-b-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center space-x-4 md:space-x-8">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-3 rounded-2xl transition-all hover:bg-black/20 active:scale-95"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Open Neural Menu"
          >
            <Menu size={28} />
          </button>
          
          <div className="flex items-center space-x-3 md:space-x-5">
            {logoUrl ? (
              <img src={logoUrl} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-xl object-cover border-2 border-white/10" alt="Sigil" />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-xl text-2xl" style={{ backgroundColor: 'var(--accent-primary)' }}>Σ</div>
            )}
            <div className="leading-none hidden sm:block">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase" style={{ color: 'var(--text-primary)' }}>Grid-9 Engineer</h1>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] mt-1 sovereign-text-accent">ARCH: TENSOR G4</p>
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-2 p-1.5 rounded-2xl border bg-black/10" style={{ borderColor: 'var(--border-primary)' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-3 ${
                activeView === item.id ? 'shadow-lg bg-[var(--accent-primary)] text-white' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ color: activeView === item.id ? 'white' : 'var(--text-primary)' }}
            >
              <item.icon size={14} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center mr-2">
            {authError ? (
              <SovereignButton onClick={handleOpenAuth} variant="banish" size="sm" className="bg-red-900/40 border-red-500 animate-pulse">
                <ShieldAlert size={14} className="mr-2" />
                Auth Link Fault
              </SovereignButton>
            ) : (
              <div className="flex items-center bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-500">
                <Zap size={10} className="mr-2 fill-emerald-500" />
                Link Secure
              </div>
            )}
          </div>
          
          <SovereignButton onClick={toggleTheme} variant="ghost" size="sm" className="hidden sm:flex items-center space-x-2">
            <Palette size={14} />
            <span className="font-mono uppercase text-[10px]">{theme}</span>
          </SovereignButton>
        </div>
      </header>

      {/* Sovereign Neural Drawer */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 lg:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute left-0 top-0 bottom-0 w-[85%] max-w-sm shadow-2xl transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} sovereign-card border-r-2 flex flex-col`} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="p-8 flex items-center justify-between border-b-2" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center space-x-4">
              {logoUrl ? (
                <img src={logoUrl} className="w-10 h-10 rounded-xl shadow-lg border border-white/10" alt="Sigil" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl" style={{ backgroundColor: 'var(--accent-primary)' }}>Σ</div>
              )}
              <div className="font-black uppercase tracking-tighter text-lg">System Menu</div>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as ViewState);
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-5 px-6 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeView === item.id ? 'shadow-xl translate-x-2' : 'opacity-60'
                }`}
                style={{ 
                  backgroundColor: activeView === item.id ? 'var(--accent-primary)' : 'rgba(0,0,0,0.1)',
                  color: activeView === item.id ? 'white' : 'var(--text-primary)'
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-8 space-y-4 border-t-2 bg-black/10" style={{ borderColor: 'var(--border-primary)' }}>
            <SovereignButton onClick={toggleTheme} variant="ghost" size="md" className="w-full justify-start space-x-3">
              <Palette size={18} />
              <span>Theme: {theme}</span>
            </SovereignButton>
            
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <SovereignButton onClick={() => fileInputRef.current?.click()} variant="ghost" size="md" className="w-full justify-start space-x-3">
              <Upload size={18} />
              <span>Import Protocol</span>
            </SovereignButton>
            <SovereignButton onClick={handleExport} variant="govern" size="md" className="w-full justify-start space-x-3">
              <Download size={18} />
              <span>Export Manifest</span>
            </SovereignButton>
          </div>
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-500 transform ${activeView === 'terminal' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
          <div className="h-full p-4 md:p-10 max-w-[1500px] mx-auto">
            <Terminal messages={messages} onSendMessage={handleSendMessage} onStopQuery={handleStopQuery} isLoading={isLoading} />
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-500 transform ${activeView === 'capabilities' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
          <div className="h-full overflow-y-auto">
            <CapabilitiesDisplay />
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-500 transform ${activeView === 'artifacts' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
          <div className="h-full">
            <ArtifactDisplay artifacts={artifacts} onArtifactsUpdate={setArtifacts} lastResponse={lastModelResponse} />
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-500 transform ${activeView === 'info' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
           <div className="h-full p-4 md:p-16 overflow-y-auto max-w-6xl mx-auto space-y-8">
             <div className="rounded-[3rem] md:rounded-[4rem] p-8 md:p-14 shadow-3xl sovereign-card relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                   <Settings size={200} />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">System Registry</h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40 mt-2">Hardware & Logic Configuration</p>
                  </div>
                  <SovereignButton onClick={() => setSystemState(DEFAULT_SYSTEM_STATE)} variant="banish" size="sm">
                    Reset Sync
                  </SovereignButton>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                  <div className="space-y-8 font-mono text-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] sovereign-text-accent border-b border-white/10 pb-3 flex items-center">
                       <Cpu size={14} className="mr-3" /> Hardware Profile
                    </h3>
                    <div className="flex justify-between border-b pb-4 border-white/5">
                      <span className="opacity-50">Sync Status</span>
                      <span className={systemState.isInitialized ? 'text-emerald-500' : 'text-amber-500'}>
                        {systemState.isInitialized ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-4 border-white/5">
                      <span className="opacity-50">Architecture</span>
                      <select 
                        value={systemState.architecture || ''} 
                        onChange={(e) => setSystemState({...systemState, architecture: e.target.value as any, isInitialized: true})}
                        className="bg-transparent border-none text-right focus:ring-0 cursor-pointer sovereign-text-accent font-black"
                      >
                        <option value="">Unknown</option>
                        <option value="aarch64">aarch64 (Pixel 9)</option>
                        <option value="other">other</option>
                      </select>
                    </div>
                    <div className="flex justify-between border-b pb-4 border-white/5 pt-4">
                      <span className="opacity-50">Neural Link</span>
                      <span className={authError ? 'text-red-500' : 'text-emerald-500'}>
                        {authError ? 'FAULT' : 'SECURE'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] sovereign-text-accent border-b border-white/10 pb-3 font-mono flex items-center">
                       <FileCode size={14} className="mr-3" /> Logic Manifest
                    </h3>
                    <textarea 
                      value={systemState.termuxInfo || ''}
                      onChange={(e) => setSystemState({...systemState, termuxInfo: e.target.value, isInitialized: true})}
                      placeholder="Paste 'termux-info' for analysis..."
                      className="w-full h-44 bg-black/20 rounded-[2rem] p-8 font-mono text-xs border border-white/5 focus:border-blue-500/50 outline-none resize-none shadow-inner"
                    />
                  </div>
                </div>
             </div>

             <div className="rounded-[3rem] p-8 md:p-12 sovereign-card">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <Sparkles className="sovereign-text-accent" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Visual Identity</h3>
                  </div>
                  <SovereignButton 
                    onClick={handleGenerateBranding} 
                    disabled={isGeneratingLogo} 
                    variant="manifest" 
                    size="sm"
                    className="space-x-2"
                  >
                    {isGeneratingLogo ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    <span>{isGeneratingLogo ? 'Fabricating...' : 'Generate Sigil'}</span>
                  </SovereignButton>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-full md:w-48 h-48 rounded-[2rem] bg-black/30 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                    {logoUrl ? (
                      <img src={logoUrl} className="w-full h-full object-cover" alt="Generated Sigil" />
                    ) : (
                      <div className="text-center p-6 opacity-30">
                        {isGeneratingLogo ? (
                          <div className="space-y-4">
                             <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                             <p className="text-[10px] font-mono animate-pulse">{generationStep}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] font-mono uppercase tracking-widest">Sigil Missing</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="text-sm opacity-70 leading-relaxed">
                      Establish a permanent visual presence for the Grid-9 Engineer. This protocol uses <strong>Nano Banana 3</strong> to fabricate a professional foil-stamped sigil based on your hardware profile.
                    </p>
                    <div className="flex items-center space-x-4">
                       <div className="w-4 h-4 rounded-full bg-[#c43333] border border-white/20"></div>
                       <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Spectrum: #C43333 // FOIL</span>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </main>

      <footer className="h-12 border-t-2 px-6 md:px-12 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
        <div className="flex items-center sovereign-text-accent">
          <span className={`w-2.5 h-2.5 rounded-full mr-3 animate-pulse ${authError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
          <span>{authError ? 'AUTH FAULT' : 'BRIDGE SECURE'}</span>
        </div>
        <div className="flex space-x-8 opacity-40">
           <span className="hidden xs:inline">PIXEL 9 // TENSOR G4</span>
           <span>Σ-GRID9 V2.7.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
