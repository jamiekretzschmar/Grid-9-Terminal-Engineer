
import React, { useState } from 'react';
import { Artifact } from '../lib/schemas.ts';
import SovereignButton from './atoms/SovereignButton.tsx';

interface ArtifactDisplayProps {
  artifacts: Artifact[];
  onArtifactsUpdate: (artifacts: Artifact[]) => void;
  lastResponse: string | null;
}

const ArtifactDisplay: React.FC<ArtifactDisplayProps> = ({ artifacts, onArtifactsUpdate, lastResponse }) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleManifestLastResponse = () => {
    if (!lastResponse) return;
    const scriptMatch = lastResponse.match(/```(?:bash|sh|shell)?\n([\s\S]*?)```/);
    const scriptContent = scriptMatch ? scriptMatch[1] : null;
    if (!scriptContent) return alert("No executable script detected.");
    const newArtifact: Artifact = {
      id: crypto.randomUUID(),
      name: `Artifact-${artifacts.length + 1}`,
      content: scriptContent,
      status: 'active',
      sovereigntyLevel: 'CONTROL',
      lastModified: Date.now(),
    };
    onArtifactsUpdate([newArtifact, ...artifacts]);
  };

  return (
    <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto max-w-7xl mx-auto space-y-12">
      <div className="flex items-center justify-between border-b-4 pb-10" style={{ borderColor: 'var(--border-primary)' }}>
        <div>
          <h2 className="text-6xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Governance</h2>
          <p className="font-mono text-xs uppercase tracking-[0.4em] mt-2 opacity-50">Active Logic Manifest</p>
        </div>
        {lastResponse && (
          <SovereignButton onClick={handleManifestLastResponse} variant="manifest" size="lg">
            Manifest Response
          </SovereignButton>
        )}
      </div>

      {artifacts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-40 opacity-20 border-4 border-dashed rounded-[5rem]" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-4xl font-black uppercase tracking-tighter">Manifest Empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {artifacts.map((artifact) => (
            <div key={artifact.id} className="rounded-[3rem] p-10 shadow-3xl flex flex-col group transition-all sovereign-card hover:sovereign-border-accent">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                      {artifact.sovereigntyLevel}
                    </span>
                    <span className="text-[10px] font-mono opacity-40">{new Date(artifact.lastModified).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter group-hover:sovereign-text-accent transition-colors">{artifact.name}</h3>
                </div>
                <SovereignButton onClick={() => handleCopy(artifact.content, artifact.id)} variant={copySuccess === artifact.id ? 'manifest' : 'ghost'} size="sm">
                  {copySuccess === artifact.id ? 'COPIED' : 'COPY'}
                </SovereignButton>
              </div>
              <div className="p-8 rounded-2xl font-mono text-sm overflow-x-auto shadow-inner bg-black/10 border" style={{ borderColor: 'var(--border-primary)', color: 'var(--accent-primary)' }}>
                <pre>{artifact.content}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtifactDisplay;
