import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Activity, Cpu, FileText, BarChart2, 
  Download, Compass, Shield, Sparkles, Sliders,
  Dna, GitBranch, Database, Atom, ArrowRight
} from 'lucide-react';

import { ENRICHED_DB, calculateDescriptorsFromSMILES } from './data/compoundsData';
import { SMILES2DCanvas, MolecularPropertiesRadar, MutationWorkbenchView } from './modules/cheminformatics/MutationWorkbench';
import { predictTargetAffinity, analyzeADMET, BioactivityPredictorView } from './modules/prediction/BioactivityPredictor';
import { KnowledgeGraphView, TaxonomyView, DossierView } from './modules/explorer/KnowledgeGraph';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompound, setSelectedCompound] = useState(ENRICHED_DB[0]);
  const [comparisonCompound, setComparisonCompound] = useState(ENRICHED_DB[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState('All');
  const [structureHighlight, setStructureHighlight] = useState('default');

  const [smilesInput, setSmilesInput] = useState('COC1=C(C=CC(=C1)C=CC(=O)CC(=O)C=CC2=CC(=C(C=C2)O)OC)O');
  const [calculatedData, setCalculatedData] = useState(null);

  const [selectedTarget, setSelectedTarget] = useState('PTGS2');
  const [mlInference, setMlInference] = useState(null);
  const [admetAnalysis, setAdmetAnalysis] = useState(null);

  useEffect(() => {
    if (smilesInput) {
      const desc = calculateDescriptorsFromSMILES(smilesInput);
      setCalculatedData(desc);
      const admet = analyzeADMET(smilesInput, desc);
      setAdmetAnalysis(admet);
      const mlResult = predictTargetAffinity(smilesInput, selectedTarget);
      setMlInference(mlResult);
    }
  }, [smilesInput, selectedTarget]);

  const handleMutateSMILES = (functionalGroup) => {
    let newSmiles = smilesInput;
    if (functionalGroup === '-OH') newSmiles += 'O';
    else if (functionalGroup === '-CH3') newSmiles += 'C';
    else if (functionalGroup === '-OCH3') newSmiles += 'OC';
    else if (functionalGroup === '-F') newSmiles += 'F';
    else if (functionalGroup === '-COOH') newSmiles += 'C(=O)O';
    else if (functionalGroup === '-NH2') newSmiles += 'N';
    else if (functionalGroup === '-CF3') newSmiles += 'C(F)(F)F';
    else if (functionalGroup === '-Cl') newSmiles += 'Cl';
    setSmilesInput(newSmiles);
  };

  const filteredDatabase = useMemo(() => {
    return ENRICHED_DB.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = c.name.toLowerCase().includes(q) || 
                          c.sourcePlant.toLowerCase().includes(q) ||
                          c.smiles.toLowerCase().includes(q);
      const matchFam = familyFilter === 'All' || c.plantFamily === familyFilter;
      return matchSearch && matchFam;
    });
  }, [searchQuery, familyFilter]);

  const plantFamilies = ['All', ...new Set(ENRICHED_DB.map(c => c.plantFamily))];

  return (
    <div className="min-h-screen bg-[#030908] text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-slate-900">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#051512] border-r border-emerald-900/40 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-emerald-900/40">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center font-bold text-emerald-400 font-mono shadow-lg shadow-emerald-950">
              <Atom className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                NATURIX <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">DISCOVERY</span>
              </div>
              <div className="text-[10px] text-emerald-400/70 font-mono tracking-wide uppercase">AI Natural Product Engine</div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart2 },
              { id: 'explorer', label: 'Natural Product Explorer', icon: Database },
              { id: 'workbench', label: 'SMILES Workbench & Mutator', icon: Cpu },
              { id: 'ai-matrix', label: 'ML Affinity & ADMET Engine', icon: Sparkles },
              { id: 'knowledge-graph', label: 'Knowledge Graph Explorer', icon: GitBranch },
              { id: 'comparator', label: 'Side-by-Side Lead Diff', icon: Sliders },
              { id: 'taxonomy', label: 'Botanical Phylogeny', icon: Compass },
              { id: 'dossier', label: 'Scientific Report Exporter', icon: FileText },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 border border-emerald-500/40' 
                      : 'text-slate-400 hover:bg-emerald-950/60 hover:text-emerald-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 m-3 bg-[#020D0A] rounded-xl border border-emerald-900/60 text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between text-emerald-400 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Real Engine Online
            </span>
            <span>OK</span>
          </div>
          <div className="text-[10px] text-slate-400">Topological Graph Compute Active</div>
        </div>
      </aside>

      <main className="flex-1 bg-[#030908] flex flex-col min-w-0 overflow-y-auto">

        <header className="h-16 bg-[#051512]/90 backdrop-blur-md border-b border-emerald-900/40 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white tracking-wide uppercase font-mono">
              {activeTab.replace('-', ' ')}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Shield className="w-3 h-3 text-emerald-400" /> Bioinformatic Platform Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dossier')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-emerald-950 font-mono"
            >
              <Download className="w-3.5 h-3.5" /> Export Research Dossier
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#061714] p-5 rounded-xl border border-emerald-900/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-mono text-emerald-400/70 uppercase">Phytochemical Library</p>
                      <h3 className="text-2xl font-bold text-white mt-1 font-mono">{ENRICHED_DB.length} Bioactive Compounds</h3>
                    </div>
                    <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-400 font-mono">
                    All Parsed with Live Graph Metrics
                  </div>
                </div>

                <div className="bg-[#061714] p-5 rounded-xl border border-emerald-900/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-mono text-emerald-400/70 uppercase">Plant Species Taxa</p>
                      <h3 className="text-2xl font-bold text-white mt-1 font-mono">12 Angiosperm Species</h3>
                    </div>
                    <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
                      <Compass className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">
                    Annotated Botanical Families
                  </div>
                </div>

                <div className="bg-[#061714] p-5 rounded-xl border border-emerald-900/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-mono text-emerald-400/70 uppercase">Protein Target Assays</p>
                      <h3 className="text-2xl font-bold text-white mt-1 font-mono">6 Biological Models</h3>
                    </div>
                    <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
                      <Dna className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-400 font-mono">
                    pIC50 & pKi Predictors
                  </div>
                </div>

                <div className="bg-[#061714] p-5 rounded-xl border border-emerald-900/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-mono text-emerald-400/70 uppercase">Drug-Likeness Rules</p>
                      <h3 className="text-2xl font-bold text-white mt-1 font-mono">Lipinski / Veber / Egan</h3>
                    </div>
                    <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">
                    Real-time Rules Evaluator
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 bg-[#061714] rounded-xl border border-emerald-900/60 p-5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-emerald-900/60 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-base font-mono">Curated Natural Product Compounds</h3>
                      <p className="text-xs text-slate-400">Chemical descriptors evaluated directly from topological SMILES strings</p>
                    </div>
                    <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded">
                      Live Calculated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ENRICHED_DB.map((cmp) => (
                      <div 
                        key={cmp.id}
                        onClick={() => {
                          setSelectedCompound(cmp);
                          setSmilesInput(cmp.smiles);
                          setActiveTab('explorer');
                        }}
                        className="p-3.5 bg-[#030E0B] hover:bg-emerald-950/60 rounded-xl border border-emerald-900/60 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">{cmp.id}</span>
                            <h4 className="font-bold text-white text-sm font-mono group-hover:text-emerald-300">{cmp.name}</h4>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                            cmp.lipinski.passes ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {cmp.lipinski.passes ? 'Lipinski OK' : 'Violation'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300">
                          <div>MW: <span className="text-white font-bold">{cmp.mw}</span></div>
                          <div>LogP: <span className="text-white font-bold">{cmp.logP}</span></div>
                          <div>TPSA: <span className="text-white font-bold">{cmp.tpsa}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#061714] rounded-xl border border-emerald-900/60 p-5 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base mb-1 font-mono">Live SMILES Workbench</h3>
                    <p className="text-xs text-slate-400 mb-4">Mutate chemical structures live by adding functional groups or entering SMILES.</p>

                    <div className="p-3 bg-[#030E0B] rounded-lg border border-emerald-900/60 space-y-2 font-mono text-xs">
                      <div className="text-emerald-400 font-bold">Current Sandbox SMILES:</div>
                      <div className="text-slate-300 truncate">{smilesInput}</div>
                      <div className="flex justify-between text-[11px] pt-1">
                        <span>Calculated MW: <strong className="text-white">{calculatedData?.mw}</strong></span>
                        <span>LogP: <strong className="text-white">{calculatedData?.logP}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('workbench')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2"
                  >
                    Open SMILES Mutator Workbench <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'explorer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#061714] p-4 rounded-xl border border-emerald-900/60 shadow-lg space-y-3">
                  <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-400" /> Search Natural Products
                  </h3>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Search name, plant, SMILES..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#030908] border border-emerald-900/80 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-emerald-400/70 block mb-1 uppercase">Botanical Family Filter</label>
                    <select
                      value={familyFilter}
                      onChange={(e) => setFamilyFilter(e.target.value)}
                      className="w-full py-1.5 px-3 bg-[#030908] border border-emerald-900/80 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      {plantFamilies.map(fam => (
                        <option key={fam} value={fam}>{fam}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-[#061714] rounded-xl border border-emerald-900/60 shadow-lg overflow-hidden max-h-[560px] overflow-y-auto divide-y divide-emerald-950">
                  <div className="p-3 bg-[#030E0B] border-b border-emerald-900/60 text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>MATCHED RECORDS</span>
                    <span className="text-emerald-400 font-bold">{filteredDatabase.length} Leads</span>
                  </div>

                  {filteredDatabase.map((cmp) => (
                    <div
                      key={cmp.id}
                      onClick={() => {
                        setSelectedCompound(cmp);
                        setSmilesInput(cmp.smiles);
                      }}
                      className={`p-3.5 cursor-pointer transition ${
                        selectedCompound.id === cmp.id 
                          ? 'bg-emerald-950/80 border-l-4 border-emerald-400' 
                          : 'hover:bg-[#030E0B]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">{cmp.id}</span>
                          <h4 className="font-bold text-white text-sm font-mono">{cmp.name}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 italic mt-0.5">{cmp.sourcePlant} ({cmp.plantFamily})</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 bg-[#061714] rounded-xl border border-emerald-900/60 p-6 shadow-xl space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-900/60 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-xs font-mono rounded border border-emerald-800 font-bold">{selectedCompound.id}</span>
                      <h2 className="text-2xl font-bold text-white font-mono">{selectedCompound.name}</h2>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-1">{selectedCompound.iupac}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSmilesInput(selectedCompound.smiles);
                      setActiveTab('workbench');
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition font-mono shadow"
                  >
                    Open in Mutator Workbench
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono uppercase text-emerald-400">2D Structural Canvas</span>
                      <div className="flex gap-1 text-[10px] font-mono">
                        <button 
                          onClick={() => setStructureHighlight('default')} 
                          className={`px-2 py-0.5 rounded ${structureHighlight === 'default' ? 'bg-emerald-600 text-slate-950 font-bold' : 'bg-emerald-950 text-emerald-400'}`}
                        >
                          Default
                        </button>
                        <button 
                          onClick={() => setStructureHighlight('pharmacophore')} 
                          className={`px-2 py-0.5 rounded ${structureHighlight === 'pharmacophore' ? 'bg-emerald-600 text-slate-950 font-bold' : 'bg-emerald-950 text-emerald-400'}`}
                        >
                          Pharmacophore
                        </button>
                      </div>
                    </div>
                    <SMILES2DCanvas smiles={selectedCompound.smiles} highlightMode={structureHighlight} />
                  </div>

                  <div className="bg-[#030E0B] p-4 rounded-xl border border-emerald-900/60 space-y-2 text-xs font-mono">
                    <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">Botanical Metadata</h4>
                    <div className="flex justify-between py-1 border-b border-emerald-950">
                      <span className="text-slate-400">Species:</span>
                      <span className="font-semibold italic text-white">{selectedCompound.sourcePlant}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-950">
                      <span className="text-slate-400">Family:</span>
                      <span className="text-slate-200">{selectedCompound.plantFamily}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-950">
                      <span className="text-slate-400">Plant Part:</span>
                      <span className="text-slate-200">{selectedCompound.plantPart}</span>
                    </div>
                    <p className="pt-2 text-slate-300 font-sans leading-relaxed text-[11px]">
                      {selectedCompound.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <MolecularPropertiesRadar desc={selectedCompound} />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">Calculated Chemical Descriptors</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="bg-[#030E0B] p-3 rounded-lg border border-emerald-900/60">
                        <span className="text-slate-400 text-[10px] block">Molecular Weight</span>
                        <span className="font-bold text-white">{selectedCompound.mw} g/mol</span>
                      </div>
                      <div className="bg-[#030E0B] p-3 rounded-lg border border-emerald-900/60">
                        <span className="text-slate-400 text-[10px] block">Wildman LogP</span>
                        <span className="font-bold text-white">{selectedCompound.logP}</span>
                      </div>
                      <div className="bg-[#030E0B] p-3 rounded-lg border border-emerald-900/60">
                        <span className="text-slate-400 text-[10px] block">TPSA</span>
                        <span className="font-bold text-white">{selectedCompound.tpsa} Å²</span>
                      </div>
                      <div className="bg-[#030E0B] p-3 rounded-lg border border-emerald-900/60">
                        <span className="text-slate-400 text-[10px] block">HBD / HBA</span>
                        <span className="font-bold text-white">{selectedCompound.hbd} / {selectedCompound.hba}</span>
                      </div>
                      <div className="bg-[#030E0B] p-3 rounded-lg border border-emerald-900/60">
                        <span className="text-slate-400 text-[10px] block">Rotatable Bonds</span>
                        <span className="font-bold text-white">{selectedCompound.rotatableBonds}</span>
                      </div>
                      <div className="bg-[#030E0B] p-3 rounded-lg border border-emerald-900/60">
                        <span className="text-slate-400 text-[10px] block">Aromatic Rings</span>
                        <span className="font-bold text-white">{selectedCompound.aromaticRings}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'workbench' && (
            <MutationWorkbenchView 
              smilesInput={smilesInput}
              setSmilesInput={setSmilesInput}
              calculatedData={calculatedData}
              handleMutateSMILES={handleMutateSMILES}
            />
          )}

          {activeTab === 'ai-matrix' && (
            <BioactivityPredictorView 
              selectedTarget={selectedTarget}
              setSelectedTarget={setSelectedTarget}
              mlInference={mlInference}
              admetAnalysis={admetAnalysis}
            />
          )}

          {/* KNOWLEDGE GRAPH TAB */}
          {activeTab === 'knowledge-graph' && (
            <KnowledgeGraphView />
          )}

          {activeTab === 'comparator' && (
            <div className="space-y-6">
              <div className="bg-[#061714] p-6 rounded-xl border border-emerald-900/60 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-base font-mono">Side-by-Side Molecular Lead Comparator</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  
                  <div className="bg-[#030E0B] p-4 rounded-xl border border-emerald-900/60 space-y-3">
                    <label className="text-emerald-400 block">Lead A Selection:</label>
                    <select
                      value={selectedCompound.id}
                      onChange={(e) => {
                        const found = ENRICHED_DB.find(c => c.id === e.target.value);
                        if (found) setSelectedCompound(found);
                      }}
                      className="w-full p-2 bg-[#061714] border border-emerald-900 rounded text-white"
                    >
                      {ENRICHED_DB.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <SMILES2DCanvas smiles={selectedCompound.smiles} />

                    <div className="space-y-1">
                      <div>Molecular Weight: <strong className="text-white">{selectedCompound.mw}</strong></div>
                      <div>LogP: <strong className="text-white">{selectedCompound.logP}</strong></div>
                      <div>TPSA: <strong className="text-white">{selectedCompound.tpsa} Å²</strong></div>
                    </div>
                  </div>

                  <div className="bg-[#030E0B] p-4 rounded-xl border border-emerald-900/60 space-y-3">
                    <label className="text-emerald-400 block">Lead B Selection:</label>
                    <select
                      value={comparisonCompound.id}
                      onChange={(e) => {
                        const found = ENRICHED_DB.find(c => c.id === e.target.value);
                        if (found) setComparisonCompound(found);
                      }}
                      className="w-full p-2 bg-[#061714] border border-emerald-900 rounded text-white"
                    >
                      {ENRICHED_DB.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <SMILES2DCanvas smiles={comparisonCompound.smiles} />

                    <div className="space-y-1">
                      <div>Molecular Weight: <strong className="text-white">{comparisonCompound.mw}</strong></div>
                      <div>LogP: <strong className="text-white">{comparisonCompound.logP}</strong></div>
                      <div>TPSA: <strong className="text-white">{comparisonCompound.tpsa} Å²</strong></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          
          {activeTab === 'taxonomy' && (
            <TaxonomyView enrichedDb={ENRICHED_DB} />
          )}

          
          {activeTab === 'dossier' && (
            <DossierView selectedCompound={selectedCompound} />
          )}

        </div>
      </main>
    </div>
  );
}
