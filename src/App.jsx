import React, { useState } from 'react';
import { MutationWorkbench } from './modules/cheminformatics/MutationWorkbench';
import { BioactivityPredictor } from './modules/prediction/BioactivityPredictor';
import { KnowledgeGraph } from './modules/explorer/KnowledgeGraph';

export default function App() {
  const [activeTab, setActiveTab] = useState('cheminformatics');

  return (
    <div className="min-h-screen bg-[#030908] text-slate-100 flex">
      {/* Navigation Sidebar */}
      <aside className="w-64 border-r border-emerald-900/40 bg-[#040D0C] p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 font-bold">
              N
            </div>
            <h1 className="text-xl font-bold tracking-wider text-emerald-400">NATURIX</h1>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('cheminformatics')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'cheminformatics' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:bg-emerald-950/30'
              }`}
            >
              1. Cheminformatics Engine
            </button>
            <button 
              onClick={() => setActiveTab('prediction')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'prediction' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:bg-emerald-950/30'
              }`}
            >
              2. AI Bioactivity Predictor
            </button>
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'explorer' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:bg-emerald-950/30'
              }`}
            >
              3. Knowledge Graph & Database
            </button>
          </nav>
        </div>

        <div className="text-xs text-slate-500 border-t border-emerald-900/30 pt-4">
          NATURIX Platform v2.4 <br />
          Scientific Innovation Contest
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'cheminformatics' && <MutationWorkbench />}
        {activeTab === 'prediction' && <BioactivityPredictor />}
        {activeTab === 'explorer' && <KnowledgeGraph />}
      </main>
    </div>
  );
}