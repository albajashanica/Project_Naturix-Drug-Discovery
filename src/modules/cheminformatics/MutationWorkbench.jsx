import React, { useRef, useEffect } from 'react';
import { calculateDescriptorsFromSMILES } from '../../data/compoundsData';
import { Plus } from 'lucide-react';

export const SMILES2DCanvas = ({ smiles, highlightMode = 'default' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const desc = calculateDescriptorsFromSMILES(smiles);
    const parsed = desc?.parsedGraph;

    if (!parsed || parsed.atoms.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Malformed or Unparseable SMILES', width / 2, height / 2);
      return;
    }

    const nodes = parsed.atoms.map((atom, idx) => {
      const angle = (idx / parsed.atoms.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.35;
      return {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        ...atom
      };
    });

    
    parsed.bonds.forEach(bond => {
      const src = nodes[bond.source];
      const tgt = nodes[bond.target];

      if (src && tgt) {
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        
        if (highlightMode === 'pharmacophore' && bond.isRing) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 3.5;
        } else if (highlightMode === 'scaffold' && !bond.isRing) {
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = bond.type === 1.5 ? 3.5 : 2;
        }
        ctx.stroke();

        if (bond.type === 1.5 || bond.type === 2) {
          ctx.beginPath();
          ctx.moveTo(src.x + 3, src.y + 3);
          ctx.lineTo(tgt.x + 3, tgt.y + 3);
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    });

    
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.element === 'C' ? 6 : 11, 0, Math.PI * 2);
      
      let fillColor = '#031411';
      if (node.element === 'O') fillColor = '#EF4444';
      else if (node.element === 'N') fillColor = '#3B82F6';
      else if (node.element === 'S') fillColor = '#F59E0B';
      else if (node.element === 'F') fillColor = '#06B6D4';
      else if (node.element === 'CL') fillColor = '#A855F7';

      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = '#030908';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (node.element !== 'C' || node.implicitH > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = node.element + (node.implicitH > 0 ? `H${node.implicitH > 1 ? node.implicitH : ''}` : '');
        ctx.fillText(label, node.x, node.y);
      }
    });

  }, [smiles, highlightMode]);

  return (
    <div className="w-full bg-[#020A08] rounded-xl p-3 border border-emerald-900/50 flex flex-col items-center justify-center relative shadow-inner">
      <canvas ref={canvasRef} width={420} height={210} className="w-full h-48 cursor-crosshair" />
      <div className="text-[11px] text-emerald-400 font-mono mt-1 max-w-full truncate px-3">
        SMILES: {smiles}
      </div>
    </div>
  );
};

export const MolecularPropertiesRadar = ({ desc }) => {
  if (!desc) return null;

  const values = [
    Math.min(100, (desc.mw / 600) * 100),
    Math.min(100, Math.max(10, ((desc.logP + 2) / 8) * 100)),
    Math.min(100, (desc.tpsa / 200) * 100),
    Math.min(100, (desc.hbd / 8) * 100),
    Math.min(100, (desc.hba / 12) * 100),
    Math.min(100, (desc.rotatableBonds / 12) * 100)
  ];

  const labels = ['MW', 'LogP', 'TPSA', 'HBD', 'HBA', 'RotB'];
  const center = 100;
  const radius = 65;

  const getCoordinates = (val, index, total = 6) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (val / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polyPoints = values.map((v, i) => {
    const { x, y } = getCoordinates(v, i);
    return `${x},${y}`;
  }).join(' ');

  const gridPoints100 = values.map((_, i) => {
    const { x, y } = getCoordinates(100, i);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-[#020A08] rounded-xl border border-emerald-900/50">
      <div className="text-xs font-mono text-emerald-400 mb-1 font-semibold uppercase tracking-wider">Property Radar</div>
      <svg width="200" height="190" viewBox="0 0 200 190">
        <polygon points={gridPoints100} fill="none" stroke="#064034" strokeWidth="1" strokeDasharray="3 3" />
        {labels.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#064034" strokeWidth="1" />;
        })}
        <polygon points={polyPoints} fill="#10B981" fillOpacity="0.35" stroke="#34D399" strokeWidth="2" />
        {labels.map((label, i) => {
          const { x, y } = getCoordinates(115, i);
          const dot = getCoordinates(values[i], i);
          return (
            <g key={i}>
              <circle cx={dot.x} cy={dot.y} r="3" fill="#34D399" />
              <text x={x} y={y} fill="#9CA3AF" fontSize="9" fontFamily="monospace" textAnchor="middle" alignmentBaseline="middle">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export function MutationWorkbenchView({ smilesInput, setSmilesInput, calculatedData, handleMutateSMILES }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base font-mono">SMILES Workbench & Structural Mutator Sandbox</h3>
            <p className="text-xs text-slate-400">Mutate SMILES strings live by attaching functional groups to observe property deltas.</p>
          </div>
          <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-3 py-1 rounded border border-emerald-800">
            Active Graph Parser
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-emerald-400 block">SMILES Structure String:</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={smilesInput}
              onChange={(e) => setSmilesInput(e.target.value)}
              placeholder="Enter valid SMILES text..."
              className="flex-1 px-3.5 py-2.5 bg-[#030908] border border-emerald-900 rounded-lg font-mono text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-900/40">
          <span className="text-xs font-mono text-slate-400 block mb-2">Append Structural Groups to Compound:</span>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {[
              { label: '+ Hydroxyl (-OH)', group: '-OH' },
              { label: '+ Methyl (-CH3)', group: '-CH3' },
              { label: '+ Methoxy (-OCH3)', group: '-OCH3' },
              { label: '+ Fluoro (-F)', group: '-F' },
              { label: '+ Carboxyl (-COOH)', group: '-COOH' },
              { label: '+ Amine (-NH2)', group: '-NH2' },
              { label: '+ Trifluoromethyl (-CF3)', group: '-CF3' },
              { label: '+ Chloro (-Cl)', group: '-Cl' },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleMutateSMILES(btn.group)}
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {calculatedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4">
            <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">Dynamic 2D Molecular Graph</h4>
            <SMILES2DCanvas smiles={smilesInput} />

            <div className="p-4 bg-[#030E0B] rounded-lg border border-emerald-900/60 space-y-2">
              <span className="text-xs font-mono text-slate-400 block">Computed 64-bit ECFP4 Circular Fingerprint:</span>
              <div className="font-mono text-xs text-emerald-400 bg-slate-950 p-3 rounded tracking-widest break-all border border-emerald-900">
                {calculatedData.fingerprint64}
              </div>
            </div>
          </div>

          <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-5">
            <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider border-b border-emerald-900/60 pb-2">Drug-Likeness Rules Evaluation</h4>

            <div className="p-4 rounded-lg border border-emerald-900/80 bg-[#030E0B] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-white font-mono">Lipinski Rule of 5</span>
                <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded border ${
                  calculatedData.lipinski.passes 
                    ? 'text-emerald-400 bg-emerald-950 border-emerald-800' 
                    : 'text-amber-400 bg-amber-950 border-amber-800'
                }`}>
                  {calculatedData.lipinski.passes ? 'PASSED' : 'VIOLATION DETECTED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#061714] rounded border border-emerald-900/60">
                  <span className="text-slate-400 text-[10px] block">Molecular Weight</span>
                  <span className="font-bold text-white">{calculatedData.mw} g/mol</span>
                </div>
                <div className="p-2.5 bg-[#061714] rounded border border-emerald-900/60">
                  <span className="text-slate-400 text-[10px] block">Wildman LogP</span>
                  <span className="font-bold text-white">{calculatedData.logP}</span>
                </div>
                <div className="p-2.5 bg-[#061714] rounded border border-emerald-900/60">
                  <span className="text-slate-400 text-[10px] block">HBD / HBA</span>
                  <span className="font-bold text-white">{calculatedData.hbd} / {calculatedData.hba}</span>
                </div>
                <div className="p-2.5 bg-[#061714] rounded border border-emerald-900/60">
                  <span className="text-slate-400 text-[10px] block">TPSA</span>
                  <span className="font-bold text-white">{calculatedData.tpsa} Å²</span>
                </div>
              </div>

              {calculatedData.lipinski.violations.length > 0 && (
                <div className="p-2 bg-amber-950/40 border border-amber-800/80 rounded text-[11px] font-mono text-amber-300">
                  Warnings: {calculatedData.lipinski.violations.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
