
import React, { useState } from 'react';
import SovereignButton from './atoms/SovereignButton.tsx';

interface Capability {
  id: string;
  category: 'Intelligence' | 'Manifestation' | 'Shield' | 'Optimization';
  title: string;
  description: string;
  command: string;
  color: string;
}

const capabilities: Capability[] = [
  { id: '1', category: 'Intelligence', title: 'Hardware Handshake', description: 'Perform a deep architectural scan to verify Tensor G4 status.', command: 'termux-info && uname -a', color: 'emerald' },
  { id: '2', category: 'Manifestation', title: 'Python Toolchain', description: 'Bootstrap a modern Python 3 development environment.', command: 'pkg install python clang make -y', color: 'blue' },
  { id: '3', category: 'Shield', title: 'Logic Jail (PRoot)', description: 'Establish a secondary 64-bit sandbox for testing.', command: 'pkg install proot-distro && proot-distro install debian', color: 'amber' },
  { id: '4', category: 'Optimization', title: 'Storage Bridge', description: 'Link internal storage with high-throughput marshalling.', command: 'termux-setup-storage', color: 'emerald' },
  { id: '5', category: 'Intelligence', title: 'Port Scan', description: 'Scan active logic ports and verify bridge integrity.', command: 'pkg install nmap && nmap localhost', color: 'blue' },
  { id: '6', category: 'Shield', title: 'Integrity Check', description: 'Scan packages for architectural anomalies.', command: 'pkg list-installed', color: 'amber' }
];

const CapabilitiesDisplay: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-16 pb-24">
      <div className="border-b-4 pb-12" style={{ borderColor: 'var(--border-primary)' }}>
        <h2 className="text-6xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Capability Lattice</h2>
        <p className="font-mono text-xs uppercase tracking-[0.4em] mt-4 max-w-2xl leading-relaxed opacity-60">
          The following logic modules represent the standard operational capacity of the Sovereign Engineer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {capabilities.map((cap) => (
          <div key={cap.id} className="rounded-[2.5rem] p-8 flex flex-col group hover:-translate-y-2 transition-all sovereign-card shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <span className="px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-current" style={{ color: 'var(--accent-primary)' }}>
                {cap.category}
              </span>
              <div className="w-3 h-3 rounded-full animate-pulse transition-colors bg-slate-400 group-hover:bg-emerald-500"></div>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:sovereign-text-accent transition-colors">{cap.title}</h3>
            <p className="text-sm leading-relaxed mb-8 flex-1 opacity-70">{cap.description}</p>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl font-mono text-[11px] break-all select-all bg-black/10 border" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                $ {cap.command}
              </div>
              <SovereignButton onClick={() => handleCopy(cap.id, cap.command)} variant={copiedId === cap.id ? "manifest" : "ghost"} size="sm" className="w-full">
                {copiedId === cap.id ? 'COPIED' : 'COPY'}
              </SovereignButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CapabilitiesDisplay;
