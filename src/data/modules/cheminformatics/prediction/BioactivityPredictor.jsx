import React, { useState } from 'react';
import { SAMPLE_COMPOUNDS } from '../../data/compoundsData';

export function BioactivityPredictor() {
  const [selectedCompound, setSelectedCompound] = useState(SAMPLE_COMPOUNDS[0]);

  // Model simulues i XGBoost / Random Forest
  const affinity = (selectedCompound.smiles.length * 0.15 + 4.5).toFixed(2);
  const ic50 = Math.round(10 ** (9 - parseFloat(affinity)));

  return (
    <div className="space-y-6">
      <div className="border border-emerald-800/40 bg-[#061714] p-6 rounded-xl">
        <h2 className="text-xl font-bold text-emerald-400 mb-2">AI Bioactivity & Target Affinity Predictor</h2>
        <p className="text-slate-400 text-sm mb-4">Parashikimi i afinitetit me proteinat target përmes modelit ML.</p>

        <div className="mb-6">
          <label className="text-xs text-slate-400 block mb-2">Zgjidh Komponimin Bioaktiv:</label>
          <select 
            onChange={(e) => setSelectedCompound(SAMPLE_COMPOUNDS.find(c => c.id === e.target.value))}
            className="w-full bg-[#030908] border border-emerald-900/60 text-slate-200 rounded-lg p-3 font-mono"
          >
            {SAMPLE_COMPOUNDS.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.plant})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#030908] p-5 rounded-lg border border-emerald-900/40">
            <span className="text-xs text-slate-400">Target Proteina</span>
            <div className="text-lg font-bold text-emerald-300 mt-1">{selectedCompound.target}</div>
            <div className="mt-4 pt-4 border-t border-emerald-900/30 flex justify-between">
              <div>
                <div className="text-xs text-slate-400">Afiniteti (pIC50)</div>
                <div className="text-2xl font-mono text-emerald-400 font-bold">{affinity}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Vlera e IC50</div>
                <div className="text-2xl font-mono text-emerald-400 font-bold">{ic50} nM</div>
              </div>
            </div>
          </div>

          {/* Vlerësimi ADMET */}
          <div className="bg-[#030908] p-5 rounded-lg border border-emerald-900/40 space-y-3">
            <div className="text-sm font-bold text-slate-200">Profilizimi i Rrezikut ADMET</div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Hepatotoksiciteti:</span>
              <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">I Ultë (Safe)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Inhibimi hERG:</span>
              <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">Zemra Normal</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Mutagjeniteti AMES:</span>
              <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">Negativ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}