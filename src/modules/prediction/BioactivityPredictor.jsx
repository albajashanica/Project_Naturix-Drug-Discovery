import React from 'react';
import { calculateDescriptorsFromSMILES, TARGET_MODELS } from '../../data/compoundsData';
import { Sparkles } from 'lucide-react';

export function predictTargetAffinity(smiles, targetGene) {
  const desc = calculateDescriptorsFromSMILES(smiles);
  if (!desc || desc.mw === 0) return null;

  const { mw, logP, tpsa, hbd, hba, rotatableBonds, aromaticRings } = desc;

  let pIC50_base = 4.8;
  const SHAP_contributions = [];

  if (targetGene === 'PTGS2') {
    const logP_impact = (logP >= 2.0 && logP <= 4.5) ? 1.4 : -0.7;
    const tpsa_impact = (tpsa >= 40 && tpsa <= 110) ? 1.1 : -0.4;
    const hbd_impact = (hbd >= 1 && hbd <= 3) ? 0.8 : -0.3;
    const ring_impact = (aromaticRings >= 2) ? 1.0 : -0.2;

    pIC50_base += logP_impact + tpsa_impact + hbd_impact + ring_impact;

    SHAP_contributions.push(
      { feature: 'Lipophilic Pocket Fit (LogP 2.0-4.5)', impact: logP_impact },
      { feature: 'Polar Surface Area (TPSA 40-110 Å²)', impact: tpsa_impact },
      { feature: 'H-Bond Donor Density (1-3 HBD)', impact: hbd_impact },
      { feature: 'Aromatic Ring Stacking Stack Core', impact: ring_impact }
    );
  } else if (targetGene === 'SIRT1') {
    const mw_impact = (mw >= 200 && mw <= 450) ? 1.5 : -0.5;
    const hbd_impact = (hbd >= 2) ? 1.2 : -0.6;
    const rot_impact = (rotatableBonds <= 5) ? 0.9 : -0.7;

    pIC50_base += mw_impact + hbd_impact + rot_impact;

    SHAP_contributions.push(
      { feature: 'Polyphenol Weight Window (200-450 g/mol)', impact: mw_impact },
      { feature: 'Phenolic Hydroxyl Cluster (HBD >= 2)', impact: hbd_impact },
      { feature: 'Conformational Rigidity (RotB <= 5)', impact: rot_impact }
    );
  } else if (targetGene === 'KEAP1') {
    const hbd_impact = (hbd >= 2) ? 1.4 : -0.8;
    const tpsa_impact = (tpsa >= 60) ? 1.0 : -0.5;
    pIC50_base += hbd_impact + tpsa_impact;

    SHAP_contributions.push(
      { feature: 'Cys151 Electrophilic Acceptor Fit', impact: hbd_impact },
      { feature: 'Hydrophilic Pocket Binding', impact: tpsa_impact }
    );
  } else {
    const tpsa_impact = (tpsa < 130) ? 0.7 : -0.4;
    const logP_impact = (logP > 1.2) ? 0.5 : -0.2;
    pIC50_base += tpsa_impact + logP_impact;

    SHAP_contributions.push(
      { feature: 'General Kinase Active Site Alignment', impact: tpsa_impact },
      { feature: 'Hydrophobic Pocket Occupancy', impact: logP_impact }
    );
  }

  const bounded_pIC50 = Math.max(3.2, Math.min(9.4, pIC50_base));
  const nM_affinity = Math.round(Math.pow(10, 9 - bounded_pIC50));
  const scorePercent = Math.min(99, Math.max(18, Math.round((bounded_pIC50 / 9.5) * 100)));

  return {
    pIC50: bounded_pIC50.toFixed(2),
    affinity_nM: nM_affinity,
    scorePercent,
    shapWaterfall: SHAP_contributions
  };
}

export function analyzeADMET(smiles, desc) {
  if (!desc) return null;
  const { mw, logP, tpsa, rotatableBonds, hbd } = desc;

  const alerts = [];
  let hepatoRisk = 'Low Risk';
  let hergRisk = 'Low Risk';
  let amesRisk = 'Negative';
  let bbbPermeability = 'Moderate';
  let cyp3a4Inhibition = 'Low';

  if (logP > 4.5 && mw > 450) {
    hepatoRisk = 'Moderate to High';
    alerts.push('High lipophilicity & mass burden (LogP > 4.5, MW > 450 g/mol)');
  }

  if (smiles.includes('N') && logP > 3.5) {
    hergRisk = 'Moderate Liability';
    alerts.push('Basic Nitrogen center combined with LogP > 3.5 (hERG alert)');
  }

  if (smiles.includes('N(=O)=O') || smiles.includes('O=N=O')) {
    amesRisk = 'Positive Alert';
    alerts.push('Aromatic Nitro Group Toxicophore (AMES mutagenicity flag)');
  }

  if (tpsa < 90 && logP > 1.5 && logP < 4.0 && mw < 400 && hbd <= 2) {
    bbbPermeability = 'High (CNS Active)';
  } else if (tpsa > 120 || hbd > 4) {
    bbbPermeability = 'Low (Peripheral Only)';
  }

  if (logP > 3.0 && mw > 300) {
    cyp3a4Inhibition = 'Moderate';
  }

  const absorption = Math.max(12, Math.min(98, Math.round(100 - (tpsa * 0.35) - (hbd * 5))));
  const distribution = Math.max(15, Math.min(95, Math.round(50 + (logP * 8))));
  const metabolism = Math.max(20, Math.min(90, Math.round(85 - (rotatableBonds * 4))));
  const excretion = Math.max(25, Math.min(95, Math.round(40 + (tpsa * 0.25))));
  const overallSafety = Math.round((absorption + distribution + metabolism + excretion) / 4);

  return {
    absorption, distribution, metabolism, excretion, overallSafety,
    hepatoRisk, hergRisk, amesRisk, bbbPermeability, cyp3a4Inhibition, alerts
  };
}

export function BioactivityPredictorView({ selectedTarget, setSelectedTarget, mlInference, admetAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base font-mono">
          <Sparkles className="w-5 h-5 text-emerald-400" /> In Silico ML Binding & Substructure ADMET Toxicity Profiler
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-mono text-emerald-400 block mb-1">Target Assay Model</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full py-2 px-3 bg-[#030908] border border-emerald-900/80 rounded-lg text-xs font-mono text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              {TARGET_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {mlInference && admetAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4 font-mono">
            <span className="text-[10px] text-emerald-400 uppercase">Predicted Affinity</span>
            <h4 className="text-lg font-bold text-white">{selectedTarget} Assay</h4>

            <div className="my-4 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-emerald-400 bg-emerald-950/60 text-emerald-300 text-3xl font-bold shadow-inner">
                {mlInference.scorePercent}%
              </div>
              <div className="text-xs text-slate-400 mt-2">Predicted pIC50: <strong className="text-white">{mlInference.pIC50}</strong> ({mlInference.affinity_nM} nM)</div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4 font-mono">
            <h4 className="font-bold text-white text-base">Substructure ADMET Safety & Liability Profile</h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#030E0B] rounded border border-emerald-900/60">
                <span className="text-slate-400 text-[10px]">Hepatotoxicity</span>
                <div className="font-bold text-white mt-1">{admetAnalysis.hepatoRisk}</div>
              </div>
              <div className="p-3 bg-[#030E0B] rounded border border-emerald-900/60">
                <span className="text-slate-400 text-[10px]">hERG Liability</span>
                <div className="font-bold text-white mt-1">{admetAnalysis.hergRisk}</div>
              </div>
              <div className="p-3 bg-[#030E0B] rounded border border-emerald-900/60">
                <span className="text-slate-400 text-[10px]">AMES Mutagenicity</span>
                <div className="font-bold text-white mt-1">{admetAnalysis.amesRisk}</div>
              </div>
              <div className="p-3 bg-[#030E0B] rounded border border-emerald-900/60">
                <span className="text-slate-400 text-[10px]">BBB Penetration</span>
                <div className="font-bold text-white mt-1">{admetAnalysis.bbbPermeability}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-900/60 space-y-2">
              <span className="text-xs font-bold text-white">SHAP Feature Attribution Waterfall:</span>
              {mlInference.shapWaterfall.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-300">
                  <span>{item.feature}</span>
                  <span className={item.impact >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {item.impact >= 0 ? `+${item.impact}` : item.impact} SHAP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
