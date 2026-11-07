import React from 'react';
import { SAMPLE_COMPOUNDS } from '../../data/compoundsData';

export function KnowledgeGraph() {
  return (
    <div className="space-y-6">
      <div className="border border-emerald-800/40 bg-[#061714] p-6 rounded-xl">
        <h2 className="text-xl font-bold text-emerald-400 mb-2">Natural Product Knowledge Graph</h2>
        <p className="text-slate-400 text-sm mb-4">Lidhjet relacionale midis Bimës → Komponimit → Targetit → Sëmundjes.</p>

        <div className="h-64 bg-[#030908] rounded-xl border border-emerald-900/40 p-4 relative overflow-hidden flex items-center justify-center">
          <div className="grid grid-cols-4 gap-8 w-full max-w-2xl text-center">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
              <div className="text-xs text-emerald-400 mb-1">Bima Source</div>
              <div className="font-bold text-xs text-slate-200">Curcuma longa</div>
            </div>
            <div className="p-3 bg-emerald-900/40 border border-emerald-600/50 rounded-lg">
              <div className="text-xs text-emerald-300 mb-1">Molekula</div>
              <div className="font-bold text-xs text-white">Curcumin</div>
            </div>
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
              <div className="text-xs text-emerald-400 mb-1">Proteina Target</div>
              <div className="font-bold text-xs text-slate-200">COX-2 / NF-kB</div>
            </div>
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
              <div className="text-xs text-emerald-400 mb-1">Indikacioni</div>
              <div className="font-bold text-xs text-slate-200">Inflamacion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Database */}
      
    </div>
  );
}