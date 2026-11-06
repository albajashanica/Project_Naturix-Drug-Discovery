import React, { useState } from 'react';
import { SAMPLE_COMPOUNDS } from '../../data/compoundsData';

export function MutationWorkbench() {
  const [smiles, setSmiles] = useState(SAMPLE_COMPOUNDS[0].smiles);
  const [selectedGroup, setSelectedGroup] = useState("-OH");

  
  const mw = (smiles.length * 12.4 + 40).toFixed(2);
  const logp = (smiles.length * 0.12 - 0.5).toFixed(2);
  const tpsa = (smiles.split('O').length * 17.07).toFixed(1);

  const applyMutation = () => {
    setSmiles(prev => prev + selectedGroup.replace('-', ''));
  };

  return (
    <div className="space-y-6">
      <div className="border border-emerald-800/40 bg-[#061714] p-6 rounded-xl">
        <h2 className="text-xl font-bold text-emerald-400 mb-2">Cheminformatics Mutation Workbench</h2>
        <p className="text-slate-400 text-sm mb-4">Modify the SMILES structure and analyze changes in real time.</p>
        
        <div className="flex gap-3 mb-6">
          <input 
            type="text" 
            value={smiles} 
            onChange={(e) => setSmiles(e.target.value)}
            className="flex-1 bg-[#030908] border border-emerald-900/60 rounded-lg px-4 py-2 font-mono text-emerald-300 focus:outline-none"
          />
          <select 
            value={selectedGroup} 
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-[#030908] border border-emerald-900/60 text-slate-200 rounded-lg px-3"
          >
            <option value="-OH">Hydroxyl (-OH)</option>
            <option value="-CH3">Methyl (-CH3)</option>
            <option value="-OCH3">Methoxy (-OCH3)</option>
            <option value="-F">Fluoro (-F)</option>
            <option value="-COOH">Carboxyl (-COOH)</option>
          </select>
          <button 
            onClick={applyMutation}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg"
          >
            Add Group
          </button>
        </div>

        
        <div className="h-48 bg-[#030908] rounded-lg border border-emerald-900/30 flex items-center justify-center font-mono text-xs text-emerald-500/70 p-4 text-center">
          <div>
            <div className="text-emerald-400 text-sm mb-2">2D Structure Visualization (SMILES Graph)</div>
            <div className="break-all max-w-md">{smiles}</div>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#061714] p-4 rounded-xl border border-emerald-900/30">
          <div className="text-xs text-slate-400">Molecular Weight (MW)</div>
          <div className="text-xl font-mono text-emerald-400">{mw} g/mol</div>
        </div>
        <div className="bg-[#061714] p-4 rounded-xl border border-emerald-900/30">
          <div className="text-xs text-slate-400">Lipophilicity (LogP)</div>
          <div className="text-xl font-mono text-emerald-400">{logp}</div>
        </div>
        <div className="bg-[#061714] p-4 rounded-xl border border-emerald-900/30">
          <div className="text-xs text-slate-400">Polar Surface Area (TPSA)</div>
          <div className="text-xl font-mono text-emerald-400">{tpsa} Å²</div>
        </div>
      </div>
    </div>
  );
}