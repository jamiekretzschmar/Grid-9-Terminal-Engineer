
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role } from '../types.ts';
import SovereignButton from './atoms/SovereignButton.tsx';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface TerminalProps {
  messages: Message[];
  onSendMessage: (text: string, imageData?: { data: string, mimeType: string }) => void;
  onStopQuery?: () => void;
  isLoading: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ messages, onSendMessage, onStopQuery, isLoading }) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;
    onSendMessage(input, attachedImage || undefined);
    setInput('');
    setAttachedImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachedImage({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const quickActions = [
    { label: "Update Sector", cmd: "pkg update && pkg upgrade" },
    { label: "Mount Storage", cmd: "termux-setup-storage" },
    { label: "Install Logic", cmd: "pkg install python" },
    { label: "Hardware Scan", cmd: "termux-info" },
  ];

  const isSendDisabled = (!input.trim() && !attachedImage) || isLoading;

  return (
    <div className="flex flex-col h-full rounded-3xl border-2 shadow-3xl overflow-hidden sovereign-card">
      <div className="px-8 py-5 border-b-2 flex items-center justify-between" style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderColor: 'var(--border-primary)' }}>
        <div className="flex space-x-4">
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: 'var(--accent-secondary)', opacity: 0.4 }}></div>
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.4 }}></div>
        </div>
        <div className="text-[10px] font-mono tracking-[0.5em] uppercase flex items-center font-black opacity-60">
          <span className="mr-3 animate-pulse sovereign-text-accent">●</span> Handshake Console
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 mono scroll-smooth">
        <div className="italic mb-10 border-b-2 pb-8 text-lg opacity-50" style={{ borderColor: 'var(--border-primary)' }}>
          [ SYSTEM LINK ESTABLISHED ]
          <br />
          [ TARGET ARCH: AARCH64 // PIXEL 9 ]
          <br />
          [ ZERO-FAILURE PROTOCOL ACTIVE ]
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-8 rounded-[2rem] shadow-2xl transition-all border-l-8 ${
              msg.role === Role.USER 
                ? 'bg-slate-800/20 border-blue-500' 
                : 'bg-black/20 border-emerald-500'
            }`} style={{ borderColor: msg.role === Role.USER ? 'var(--accent-secondary)' : 'var(--accent-primary)' }}>
              <div className="flex items-center justify-between mb-4 opacity-40 text-[10px] uppercase font-black tracking-[0.3em]">
                <span>{msg.role === Role.USER ? 'Local Overseer' : 'Sovereign Engineer'}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-lg md:text-xl">
                {msg.text}
              </div>
              {msg.imageData && (
                <div className="mt-6 border-4 border-white/5 rounded-2xl overflow-hidden bg-black/60 p-2">
                  <img src={`data:${msg.imageData.mimeType};base64,${msg.imageData.data}`} alt="Capture" className="max-h-[500px] w-full object-contain rounded-xl" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center space-x-6">
            <div className="p-8 border-l-8 rounded-r-[2rem] animate-pulse flex items-center space-x-6 shadow-2xl bg-black/10" style={{ borderColor: 'var(--accent-primary)' }}>
              <div className="flex space-x-2">
                <div className="w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                <div className="w-4 h-4 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
              </div>
              <span className="text-sm font-black uppercase tracking-[0.4em] sovereign-text-accent">Processing...</span>
            </div>
            {onStopQuery && (
              <SovereignButton onClick={onStopQuery} variant="ghost" size="sm" className="text-red-500">
                Cancel
              </SovereignButton>
            )}
          </div>
        )}
      </div>

      <div className="px-8 py-4 border-t-2 flex space-x-4 overflow-x-auto no-scrollbar" style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderColor: 'var(--border-primary)' }}>
        {quickActions.map((action, idx) => (
          <SovereignButton
            key={idx}
            onClick={() => onSendMessage(action.cmd)}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="whitespace-nowrap opacity-60 hover:opacity-100"
          >
            {action.label}
          </SovereignButton>
        ))}
      </div>

      <div className="p-8 border-t-2 shadow-2xl z-10" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        {attachedImage && (
          <div className="mb-6 relative inline-block group">
            <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} className="h-40 w-auto rounded-2xl border-4 sovereign-border-accent shadow-3xl" alt="Asset" />
            <button 
              onClick={() => setAttachedImage(null)} 
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-3xl hover:bg-red-700 transition-colors"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-6 rounded-[1.5rem] px-8 py-3 border-2 transition-all shadow-inner bg-black/10" style={{ borderColor: 'var(--border-primary)' }}>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className="opacity-40 hover:opacity-100 transition-all transform hover:scale-110"
            title="Attach Asset"
          >
            <ImageIcon size={32} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <span className="font-black mono text-3xl animate-pulse sovereign-text-accent" aria-hidden="true">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Command neural interface..."
            className="flex-1 bg-transparent border-none outline-none mono text-xl focus:ring-0 h-16"
            style={{ color: 'var(--text-primary)' }}
            autoFocus
          />
          <SovereignButton 
            type="submit" 
            disabled={isSendDisabled} 
            variant="manifest" 
            className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
            aria-label="Send command"
          >
            <Send size={28} className={isSendDisabled ? 'opacity-50' : 'opacity-100'} />
          </SovereignButton>
        </form>
      </div>
    </div>
  );
};

export default Terminal;
