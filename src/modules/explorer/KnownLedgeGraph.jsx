import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Network } from 'lucide-react';

export const InteractiveKnowledgeGraph = ({ onSelectNode }) => {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const graphNodes = useMemo(() => [
    { id: 'c1', label: 'Curcumin', type: 'Phytochemical', color: '#10B981', radius: 18, x: 240, y: 170 },
    { id: 'c2', label: 'Resveratrol', type: 'Phytochemical', color: '#10B981', radius: 18, x: 390, y: 130 },
    { id: 'c3', label: 'Artemisinin', type: 'Phytochemical', color: '#10B981', radius: 18, x: 470, y: 270 },
    { id: 'c4', label: 'Quercetin', type: 'Phytochemical', color: '#10B981', radius: 18, x: 190, y: 310 },
    { id: 'c5', label: 'EGCG', type: 'Phytochemical', color: '#10B981', radius: 18, x: 550, y: 200 },
    { id: 'p1', label: 'Curcuma longa', type: 'Plant Species', color: '#059669', radius: 14, x: 110, y: 130 },
    { id: 'p2', label: 'Vitis vinifera', type: 'Plant Species', color: '#059669', radius: 14, x: 500, y: 70 },
    { id: 'p3', label: 'Camellia sinensis', type: 'Plant Species', color: '#059669', radius: 14, x: 640, y: 140 },
    { id: 't1', label: 'COX-2 (PTGS2)', type: 'Target Protein', color: '#3B82F6', radius: 15, x: 310, y: 250 },
    { id: 't2', label: 'SIRT1 Deacetylase', type: 'Target Protein', color: '#3B82F6', radius: 15, x: 450, y: 170 },
    { id: 't3', label: 'EGFR Kinase', type: 'Target Protein', color: '#3B82F6', radius: 15, x: 330, y: 360 },
    { id: 'd1', label: 'Rheumatoid Arthritis', type: 'Disease Pathway', color: '#EC4899', radius: 16, x: 380, y: 370 },
    { id: 'd2', label: 'Cardiovascular Disease', type: 'Disease Pathway', color: '#EC4899', radius: 16, x: 600, y: 110 }
  ], []);

  const graphLinks = useMemo(() => [
    { source: 'p1', target: 'c1' }, { source: 'p2', target: 'c2' }, { source: 'p3', target: 'c5' },
    { source: 'c1', target: 't1' }, { source: 'c2', target: 't2' }, { source: 'c4', target: 't1' },
    { source: 'c4', target: 't3' }, { source: 'c5', target: 't3' }, { source: 't1', target: 'd1' },
    { source: 't2', target: 'd2' }
  ], []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      graphLinks.forEach(link => {
        const s = graphNodes.find(n => n.id === link.source);
        const t = graphNodes.find(n => n.id === link.target);
        if (s && t) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = '#0B3B30';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      graphNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = selectedNode?.id === node.id ? 18 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#030908';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 12);
      });
    };

    render();
  }, [graphNodes, graphLinks, selectedNode]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = graphNodes.find(node => Math.hypot(node.x - clickX, node.y - clickY) <= node.radius);
    if (clicked) {
      setSelectedNode(clicked);
      if (onSelectNode) onSelectNode(clicked);
    }
  };

  return (
    <div className="relative w-full bg-[#030908] rounded-xl border border-emerald-900/60 overflow-hidden shadow-2xl">
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-emerald-950/90 text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-800 flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-emerald-400" /> Interactive Force Graph
        </span>
      </div>

      <canvas ref={canvasRef} width={800} height={440} onClick={handleCanvasClick} className="w-full h-[440px] cursor-pointer" />

      {selectedNode && (
        <div className="absolute top-3 right-3 bg-[#061714]/95 p-4 rounded-xl border border-emerald-700/80 w-64 text-xs space-y-2 z-10 text-slate-200 backdrop-blur-md">
          <div className="flex justify-between items-start border-b border-emerald-900 pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400">{selectedNode.type}</span>
              <h4 className="font-bold text-white text-sm">{selectedNode.label}</h4>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">&times;</button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Target entity interconnected across multi-target network pathways.
          </p>
        </div>
      )}
    </div>
  );
};

export function KnowledgeGraphView() {
  return (
    <div className="space-y-6">
      <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base font-mono">Force-Directed Knowledge Graph Explorer</h3>
        <InteractiveKnowledgeGraph />
      </div>
    </div>
  );
}

export function TaxonomyView({ enrichedDb }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="font-bold text-white text-base">Botanical Taxa Phytochemistry Index</h3>

        <div className="space-y-2">
          {enrichedDb.map(c => (
            <div key={c.id} className="p-3 bg-[#030E0B] rounded border border-emerald-900/60 flex justify-between items-center">
              <div>
                <span className="text-emerald-400 font-bold">{c.plantFamily}</span> &rarr; <span className="italic text-slate-200">{c.sourcePlant}</span>
              </div>
              <span className="font-bold text-white">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DossierView({ selectedCompound }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl flex justify-between items-center">
        <div>
          <h3 className="font-bold text-white text-base font-mono">Scientific Research Dossier Exporter</h3>
          <p className="text-xs text-slate-400">Generates formal academic research document for {selectedCompound.name}.</p>
        </div>
       
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition font-mono"
        >
          Print / Save PDF Report
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl text-slate-900 font-serif space-y-6 shadow-2xl">
        <div className="border-b-2 border-emerald-900 pb-3 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold font-sans">NATURIX Research Dossier: {selectedCompound.name}</h1>
            <div className="text-xs text-slate-500 font-mono">ID: {selectedCompound.id}</div>
          </div>
        </div>

        <div className="font-sans text-xs space-y-2">
          <h3 className="font-bold text-slate-900 uppercase">1. Chemical Descriptors Summary</h3>
          <p className="bg-slate-50 p-3 rounded border border-slate-200 font-mono">
            SMILES: {selectedCompound.smiles}<br/>
            Molecular Weight: {selectedCompound.mw} g/mol | LogP: {selectedCompound.logP} | TPSA: {selectedCompound.tpsa} Å²
          </p>
        </div>

        <div className="font-sans text-xs space-y-2">
          <h3 className="font-bold text-slate-900 uppercase">2. Literature Citations</h3>
          <div className="font-mono">
            {selectedCompound.pmids.join(', ')} | DOI: {selectedCompound.doi}
          </div>
        </div>
      </div>
    </div>
  );
}
