export const ATOMIC_WEIGHTS = {
  C: 12.011, H: 1.008, O: 15.999, N: 14.007, S: 32.06,
  F: 18.998, Cl: 35.45, Br: 79.904, I: 126.90, P: 30.974
};

export const FRAGMENT_METRICS = {
  'C_alkane': { logP: 0.20, tpsa: 0.0 },
  'C_aromatic': { logP: 0.35, tpsa: 0.0 },
  'O_hydroxyl': { logP: -0.40, tpsa: 20.23 },
  'O_ether': { logP: -0.15, tpsa: 9.23 },
  'O_carbonyl': { logP: -0.25, tpsa: 17.07 },
  'N_amine': { logP: -0.65, tpsa: 12.03 },
  'N_amide': { logP: -0.80, tpsa: 29.10 },
  'S_sulfide': { logP: 0.45, tpsa: 25.30 },
  'F': { logP: 0.50, tpsa: 0.0 },
  'Cl': { logP: 0.75, tpsa: 0.0 },
  'Br': { logP: 0.90, tpsa: 0.0 }
};

export const PAINS_PATTERNS = [
  { name: 'Quinone / Catechol Redox Alert', pattern: 'C(=O)C=CC(=O)' },
  { name: 'Rhodanine Reactive Core', pattern: 'S=C1NC(=O)CS1' },
  { name: 'Alkyne Conjugated System', pattern: 'C#C' },
  { name: 'Enone Reactive Acceptor', pattern: 'C=CC=O' },
  { name: 'Aromatic Nitro Toxicophore', pattern: 'N(=O)=O' }
];

export function parseSMILES(smiles) {
  if (!smiles || typeof smiles !== 'string') return null;
  
  const atoms = [];
  const bonds = [];
  const ringStore = {};
  let currentAtomIndex = -1;

  let i = 0;
  const cleanSmiles = smiles.trim();

  while (i < cleanSmiles.length) {
    const char = cleanSmiles[i];

    if (char === '(' || char === ')') {
      i++;
      continue;
    }

    if (/\d/.test(char)) {
      const ringId = char;
      if (ringStore[ringId] !== undefined) {
        bonds.push({ source: ringStore[ringId], target: currentAtomIndex, type: 1, isRing: true });
        delete ringStore[ringId];
      } else {
        ringStore[ringId] = currentAtomIndex;
      }
      i++;
      continue;
    }

    let symbol = char;
    if (i + 1 < cleanSmiles.length) {
      const nextChar = cleanSmiles[i + 1];
      if ((char === 'C' && nextChar === 'l') || (char === 'B' && nextChar === 'r')) {
        symbol = char + nextChar;
        i++;
      }
    }

    const isAromatic = symbol === symbol.toLowerCase() && /[c-z]/.test(symbol);
    const upperSymbol = symbol.toUpperCase();

    if (ATOMIC_WEIGHTS[upperSymbol] || isAromatic) {
      const atomObj = {
        id: atoms.length,
        element: upperSymbol,
        isAromatic: isAromatic,
        implicitH: 0
      };
      
      if (upperSymbol === 'C') atomObj.implicitH = isAromatic ? 1 : 3;
      else if (upperSymbol === 'O') atomObj.implicitH = 1;
      else if (upperSymbol === 'N') atomObj.implicitH = isAromatic ? 0 : 2;

      atoms.push(atomObj);
      const newAtomIndex = atoms.length - 1;

      if (currentAtomIndex >= 0) {
        bonds.push({ source: currentAtomIndex, target: newAtomIndex, type: isAromatic ? 1.5 : 1 });
      }
      currentAtomIndex = newAtomIndex;
    }

    i++;
  }

  return { atoms, bonds };
}

export function calculateDescriptorsFromSMILES(smiles) {
  const parsed = parseSMILES(smiles);
  if (!parsed || parsed.atoms.length === 0) {
    return {
      mw: 0, logP: 0, tpsa: 0, hbd: 0, hba: 0, rotatableBonds: 0, heavyAtoms: 0, aromaticRings: 0,
      lipinski: { passes: false, violations: ['Invalid or unparseable SMILES string'] },
      veber: { passes: false }, egan: { passes: false }, leadLikeness: { passes: false },
      painsAlerts: [], fingerprint64: '0'.repeat(64), parsedGraph: null
    };
  }

  let mw = 0;
  let logP = 0;
  let tpsa = 0;
  let hbd = 0;
  let hba = 0;
  let rotatableBonds = 0;
  let heavyAtoms = 0;
  let aromaticAtoms = 0;

  parsed.atoms.forEach((atom) => {
    const el = atom.element;
    const weight = ATOMIC_WEIGHTS[el] || 12.011;
    mw += weight + (atom.implicitH * ATOMIC_WEIGHTS['H']);

    if (el !== 'H') heavyAtoms++;
    if (atom.isAromatic) aromaticAtoms++;

    if (el === 'O') {
      hba++;
      if (atom.implicitH > 0) {
        hbd++;
        tpsa += FRAGMENT_METRICS['O_hydroxyl'].tpsa;
        logP += FRAGMENT_METRICS['O_hydroxyl'].logP;
      } else {
        tpsa += FRAGMENT_METRICS['O_ether'].tpsa;
        logP += FRAGMENT_METRICS['O_ether'].logP;
      }
    } else if (el === 'N') {
      hba++;
      if (atom.implicitH > 0) {
        hbd += atom.implicitH;
        tpsa += FRAGMENT_METRICS['N_amine'].tpsa * atom.implicitH;
        logP += FRAGMENT_METRICS['N_amine'].logP;
      } else {
        tpsa += FRAGMENT_METRICS['N_amide'].tpsa;
        logP += FRAGMENT_METRICS['N_amide'].logP;
      }
    } else if (el === 'C') {
      logP += atom.isAromatic ? FRAGMENT_METRICS['C_aromatic'].logP : FRAGMENT_METRICS['C_alkane'].logP;
    } else if (FRAGMENT_METRICS[el]) {
      logP += FRAGMENT_METRICS[el].logP;
    }
  });

  parsed.bonds.forEach(bond => {
    if (bond.type === 1 && !bond.isRing) {
      const srcAtom = parsed.atoms[bond.source];
      const tgtAtom = parsed.atoms[bond.target];
      if (srcAtom.element !== 'H' && tgtAtom.element !== 'H') {
        rotatableBonds++;
      }
    }
  });

  const aromaticRings = Math.floor(aromaticAtoms / 6);
  mw = Math.round(mw * 100) / 100;
  logP = Math.round(logP * 100) / 100;
  tpsa = Math.round(tpsa * 100) / 100;

  const lipinskiViolations = [];
  if (mw > 500) lipinskiViolations.push(`MW > 500 g/mol (${mw})`);
  if (logP > 5.0) lipinskiViolations.push(`LogP > 5.0 (${logP})`);
  if (hbd > 5) lipinskiViolations.push(`H-Bond Donors > 5 (${hbd})`);
  if (hba > 10) lipinskiViolations.push(`H-Bond Acceptors > 10 (${hba})`);
  const lipinskiPasses = lipinskiViolations.length <= 1;

  const veberPasses = tpsa <= 140 && rotatableBonds <= 10;
  const eganPasses = logP <= 5.8 && tpsa <= 131.6;
  const leadLikenessPasses = mw >= 250 && mw <= 350 && logP <= 3.5 && rotatableBonds <= 7;

  const painsAlerts = [];
  PAINS_PATTERNS.forEach(pains => {
    if (smiles.includes(pains.pattern)) {
      painsAlerts.push(pains.name);
    }
  });

  let fpHash1 = 0;
  let fpHash2 = 0;
  smiles.split('').forEach((c, idx) => {
    const code = c.charCodeAt(0);
    fpHash1 = ((fpHash1 << 5) - fpHash1) + code + (idx * 31);
    fpHash2 = ((fpHash2 << 7) - fpHash2) + code + (idx * 17);
    fpHash1 |= 0;
    fpHash2 |= 0;
  });
  const fingerprint64 = Math.abs(fpHash1).toString(2).padStart(32, '0') + 
                        Math.abs(fpHash2).toString(2).padStart(32, '0');

  return {
    mw, logP, tpsa, hbd, hba, rotatableBonds, heavyAtoms, aromaticRings,
    lipinski: { passes: lipinskiPasses, violations: lipinskiViolations },
    veber: { passes: veberPasses },
    egan: { passes: eganPasses },
    leadLikeness: { passes: leadLikenessPasses },
    painsAlerts,
    fingerprint64,
    parsedGraph: parsed
  };
}

export const PHYTOCHEMICALS_DB = [
  {
    id: 'NAT-001',
    name: 'Curcumin',
    iupac: '(1E,6E)-1,7-bis(4-hydroxy-3-methoxyphenyl)hepta-1,6-diene-3,5-dione',
    formula: 'C21H20O6',
    smiles: 'COC1=C(C=CC(=C1)C=CC(=O)CC(=O)C=CC2=CC(=C(C=C2)O)OC)O',
    sourcePlant: 'Curcuma longa',
    commonPlantName: 'Turmeric',
    plantFamily: 'Zingiberaceae',
    plantPart: 'Rhizome',
    biologicalActivities: ['Anti-inflammatory', 'Antioxidant', 'Anticancer', 'Neuroprotective'],
    targets: [
      { gene: 'PTGS2', name: 'Cyclooxygenase-2 (COX-2)', affinity: '1.2 µM', pIC50: 5.92, type: 'Inhibitor' },
      { gene: 'NFKB1', name: 'Nuclear Factor Kappa B Subunit 1', affinity: '0.45 µM', pIC50: 6.34, type: 'Inhibitor' },
      { gene: 'EGFR', name: 'Epidermal Growth Factor Receptor', affinity: '3.1 µM', pIC50: 5.50, type: 'Inhibitor' }
    ],
    pathways: ['NF-kB Signaling Pathway', 'Arachidonic Acid Metabolism', 'Apoptosis Cascade'],
    diseaseIndications: ['Rheumatoid Arthritis', 'Colorectal Cancer', 'Alzheimers Disease'],
    pmids: ['PMID: 17569205', 'PMID: 26088351'],
    doi: '10.1021/jm000216a',
    scaffold: 'Diarylheptanoid',
    description: 'Polyphenolic constituent of turmeric rhizomes exhibiting potent pleiotropic anti-inflammatory activity through inhibition of COX-2 and downstream NF-kB transcription factors.'
  },
  {
    id: 'NAT-002',
    name: 'Resveratrol',
    iupac: '5-[(E)-2-(4-hydroxyphenyl)ethenyl]benzene-1,3-diol',
    formula: 'C14H12O3',
    smiles: 'C1=CC(=CC=C1C=CC2=CC(=CC(=C2)O)O)O',
    sourcePlant: 'Vitis vinifera',
    commonPlantName: 'Grapevine',
    plantFamily: 'Vitaceae',
    plantPart: 'Fruit Skin',
    biologicalActivities: ['Antioxidant', 'Cardioprotective', 'Longevity Inducer', 'Anti-inflammatory'],
    targets: [
      { gene: 'SIRT1', name: 'NAD-dependent deacetylase sirtuin-1', affinity: '0.15 µM', pIC50: 6.82, type: 'Activator' },
      { gene: 'PTGS1', name: 'Cyclooxygenase-1 (COX-1)', affinity: '0.80 µM', pIC50: 6.09, type: 'Inhibitor' }
    ],
    pathways: ['Sirtuin Longevity Pathway', 'AMPK Energy Homeostasis'],
    diseaseIndications: ['Cardiovascular Disease', 'Type 2 Diabetes', 'Metabolic Syndrome'],
    pmids: ['PMID: 12821886', 'PMID: 17086191'],
    doi: '10.1038/nature01960',
    scaffold: 'Stilbenoid',
    description: 'A stilbenoid polyphenol produced in grapes and berries under stress conditions. Known for allosteric activation of SIRT1 deacetylase.'
  },
  {
    id: 'NAT-003',
    name: 'Artemisinin',
    iupac: '(3R,5aS,6R,8aS,9R,12S,12aR)-octahydro-3,6,9-trimethyl-3,12-epoxy-12H-pyrano[4,3-j]-1,2-benzodioxepin-10(3H)-one',
    formula: 'C15H22O5',
    smiles: 'CC1CCC2C(C(=O)OC3C24C1CCC(O3)(OO4)C)C',
    sourcePlant: 'Artemisia annua',
    commonPlantName: 'Sweet Wormwood',
    plantFamily: 'Asteraceae',
    plantPart: 'Aerial Leaves',
    biologicalActivities: ['Antimicrobial', 'Antimalarial', 'Anticancer'],
    targets: [
      { gene: 'ATP2A6', name: 'PfATP6 Ca2+-ATPase Pump', affinity: '0.08 µM', pIC50: 7.09, type: 'Inhibitor' }
    ],
    pathways: ['Endoperoxide Iron-Mediated ROS Cleavage'],
    diseaseIndications: ['Falciparum Malaria', 'Triple-Negative Breast Cancer'],
    pmids: ['PMID: 26574888', 'PMID: 15632426'],
    doi: '10.1021/cr0502017',
    scaffold: 'Sesquiterpene Endoperoxide',
    description: 'Sesquiterpene lactone containing a 1,2,4-trioxane ring that generates cytotoxic reactive oxygen species upon reaction with intra-parasitic heme iron.'
  },
  {
    id: 'NAT-004',
    name: 'Quercetin',
    iupac: '2-(3,4-dihydroxyphenyl)-3,5,7-trihydroxychromen-4-one',
    formula: 'C15H10O7',
    smiles: 'C1=CC(=C(C=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)O)O)O',
    sourcePlant: 'Sophora japonica',
    commonPlantName: 'Japanese Pagoda Tree',
    plantFamily: 'Fabaceae',
    plantPart: 'Flower Buds',
    biologicalActivities: ['Antioxidant', 'Anti-inflammatory', 'Senolytic', 'Antiviral'],
    targets: [
      { gene: 'PIK3CA', name: 'Phosphoinositide 3-kinase alpha', affinity: '2.1 µM', pIC50: 5.67, type: 'Inhibitor' },
      { gene: 'EGFR', name: 'Epidermal Growth Factor Receptor', affinity: '1.4 µM', pIC50: 5.85, type: 'Inhibitor' }
    ],
    pathways: ['PI3K/Akt Cell Survival', 'Senescence Secretory Phenotype'],
    diseaseIndications: ['Idiopathic Pulmonary Fibrosis', 'Chronic Inflammation'],
    pmids: ['PMID: 28911543', 'PMID: 21631430'],
    doi: '10.1016/j.ejphar.2016.03.048',
    scaffold: 'Flavonol',
    description: 'Flavonol polyphenol abundantly present in vegetables and herbs, demonstrating strong free-radical scavenging and kinase inhibition.'
  },
  {
    id: 'NAT-005',
    name: 'Epigallocatechin gallate (EGCG)',
    iupac: '[(2R,3R)-5,7-dihydroxy-2-(3,4,5-trihydroxyphenyl)-3,4-dihydro-2H-chromen-3-yl] 3,4,5-trihydroxybenzoate',
    formula: 'C22H18O11',
    smiles: 'C1C(C(OC2=CC(=CC(=C21)O)O)C3=CC(=C(C(=C3)O)O)O)OC(=O)C4=CC(=C(C(=C4)O)O)O',
    sourcePlant: 'Camellia sinensis',
    commonPlantName: 'Green Tea',
    plantFamily: 'Theaceae',
    plantPart: 'Leaves',
    biologicalActivities: ['Antioxidant', 'Anticancer', 'Metabolic Regulation', 'Neuroprotective'],
    targets: [
      { gene: 'DNMT1', name: 'DNA Methyltransferase 1', affinity: '0.21 µM', pIC50: 6.67, type: 'Inhibitor' },
      { gene: 'EGFR', name: 'Epidermal Growth Factor Receptor', affinity: '1.10 µM', pIC50: 5.95, type: 'Inhibitor' }
    ],
    pathways: ['Epigenetic DNA Demethylation', 'Receptor Kinase Inactivation'],
    diseaseIndications: ['Prostate Cancer', 'Metabolic Syndrome', 'Alzheimers Disease'],
    pmids: ['PMID: 15933348', 'PMID: 19808384'],
    doi: '10.1038/nrc1934',
    scaffold: 'Flavan-3-ol Gallate Ester',
    description: 'The major polyphenolic catechin found in green tea, studied for epigenetic DNA methyltransferase suppression and inhibition of amyloid aggregation.'
  },
  {
    id: 'NAT-006',
    name: 'Berberine',
    iupac: '9,10-dimethoxy-5,6-dihydro[1,3]dioxolo[4,5-g]isoquinolino[3,2-a]isoquinolin-7-ium',
    formula: 'C20H18NO4+',
    smiles: 'COC1=C(C2=C[N+]3=C(C2=CC1=O)C4=CC5=C(C=C4CC3)OCO5)OC',
    sourcePlant: 'Berberis vulgaris',
    commonPlantName: 'Barberry',
    plantFamily: 'Berberidaceae',
    plantPart: 'Root Bark',
    biologicalActivities: ['Metabolic Regulator', 'Antimicrobial', 'Lipid-lowering', 'Anti-diabetic'],
    targets: [
      { gene: 'AMPK', name: '5\' AMP-activated protein kinase', affinity: '0.42 µM', pIC50: 6.37, type: 'Activator' },
      { gene: 'AChE', name: 'Acetylcholinesterase', affinity: '0.58 µM', pIC50: 6.23, type: 'Inhibitor' }
    ],
    pathways: ['AMPK Cellular Energy Pathway', 'Hepatic Cholesterol Clearance'],
    diseaseIndications: ['Type 2 Diabetes', 'Hyperlipidemia', 'Metabolic Dysfunction'],
    pmids: ['PMID: 18442638', 'PMID: 15531889'],
    doi: '10.1038/nm1135',
    scaffold: 'Isoquinoline Alkaloid',
    description: 'Quaternary isoquinoline alkaloid with systemic metabolic regulatory effects mediated via AMPK kinase phosphorylation.'
  },
  {
    id: 'NAT-007',
    name: 'Sulforaphane',
    iupac: '1-isothiocyanato-4-(methylsulfinyl)butane',
    formula: 'C6H11NOS2',
    smiles: 'CS(=O)CCCCN=C=S',
    sourcePlant: 'Brassica oleracea',
    commonPlantName: 'Broccoli Sprouts',
    plantFamily: 'Brassicaceae',
    plantPart: 'Sprouts',
    biologicalActivities: ['Nrf2 Activator', 'Phase II Detoxification', 'Anticancer'],
    targets: [
      { gene: 'KEAP1', name: 'Kelch-like ECH-associated protein 1', affinity: '0.05 µM', pIC50: 7.30, type: 'Covalent Modifier' },
      { gene: 'NFE2L2', name: 'Nrf2 Transcription Factor', affinity: '0.12 µM', pIC50: 6.92, type: 'Nuclear Translocator' }
    ],
    pathways: ['Keap1-Nrf2-ARE Antioxidant Response System'],
    diseaseIndications: ['Oxidative Stress Pathologies', 'Prostate Cancer Chemoprevention'],
    pmids: ['PMID: 15155621', 'PMID: 25313065'],
    doi: '10.1073/pnas.89.6.2399',
    scaffold: 'Isothiocyanate',
    description: 'Organosulfur isothiocyanate capable of alkylating Keap1 Cys151 residues to induce nuclear translocation of Nrf2 master antioxidant regulators.'
  },
  {
    id: 'NAT-008',
    name: 'Paclitaxel (Taxol)',
    iupac: '[(1S,2S,3R,4S,7R,9S,10S,12R,15S)-4,12-diacetoxy-15-{[(2R,3S)-3-(benzoylamino)-2-hydroxy-3-phenylpropanoyl]oxy}-1,9-dihydroxy-10,14,17,17-tetramethyl-11-oxo-6-oxatetracyclo[11.3.1.0³,¹⁰.0⁴,⁷]heptadec-13-en-2-yl] benzoate',
    formula: 'C47H51NO14',
    smiles: 'CC1=C2C(C(=O)C3(C(CC4C(C3C(C(=O)C2(C)C)OC(=O)C5=CC=CC=C5)(CO4)OC(=O)C)O)C)OC(=O)C(C(C6=CC=CC=C6)NC(=O)C7=CC=CC=C7)O',
    sourcePlant: 'Taxus brevifolia',
    commonPlantName: 'Pacific Yew',
    plantFamily: 'Taxaceae',
    plantPart: 'Inner Bark',
    biologicalActivities: ['Antineoplastic', 'Microtubule Stabilizer', 'Cytotoxic'],
    targets: [
      { gene: 'TUBB', name: 'Tubulin Beta Chain', affinity: '0.01 µM', pIC50: 8.00, type: 'Stabilizer' }
    ],
    pathways: ['Mitotic Spindle Assembly Arrest'],
    diseaseIndications: ['Ovarian Cancer', 'Metastatic Breast Cancer', 'NSCLC'],
    pmids: ['PMID: 1989771', 'PMID: 7906388'],
    doi: '10.1021/jm00159a001',
    scaffold: 'Diterpenoid Taxane',
    description: 'Complex diterpenoid taxane that binds specifically to the beta-subunit of tubulin, suppressing dynamic instability during mitotic cell division.'
  },
  {
    id: 'NAT-009',
    name: 'Baicalein',
    iupac: '5,6,7-trihydroxy-2-phenylchromen-4-one',
    formula: 'C15H10O5',
    smiles: 'C1=CC=C(C=C1)C2=CC(=O)C3=C(C(=C(C=C3O2)O)O)O',
    sourcePlant: 'Scutellaria baicalensis',
    commonPlantName: 'Chinese Skullcap',
    plantFamily: 'Lamiaceae',
    plantPart: 'Root',
    biologicalActivities: ['Anti-inflammatory', 'Neuroprotective', 'Antiviral'],
    targets: [
      { gene: 'ALOX12', name: 'Arachidonate 12-Lipoxygenase', affinity: '0.12 µM', pIC50: 6.92, type: 'Inhibitor' }
    ],
    pathways: ['Lipoxygenase Inflammatory Pathway'],
    diseaseIndications: ['Neuroinflammation', 'Ischemic Stroke'],
    pmids: ['PMID: 20438521'],
    doi: '10.1016/j.bcp.2010.04.025',
    scaffold: 'Flavone',
    description: 'Flavone constituent derived from Chinese Skullcap roots exhibiting selective 12-LOX enzymatic inhibition.'
  },
  {
    id: 'NAT-010',
    name: 'Genistein',
    iupac: '5,7-dihydroxy-3-(4-hydroxyphenyl)chromen-4-one',
    formula: 'C15H10O5',
    smiles: 'C1=CC(=CC=C1C2=COC3=CC(=CC(=C3C2=O)O)O)O',
    sourcePlant: 'Glycine max',
    commonPlantName: 'Soybean',
    plantFamily: 'Fabaceae',
    plantPart: 'Beans',
    biologicalActivities: ['Phytoestrogen', 'Tyrosine Kinase Inhibitor', 'Antioxidant'],
    targets: [
      { gene: 'ESR1', name: 'Estrogen Receptor Alpha', affinity: '0.04 µM', pIC50: 7.40, type: 'Agonist' }
    ],
    pathways: ['Estrogen Receptor Signaling Core'],
    diseaseIndications: ['Osteoporosis', 'Postmenopausal Symptoms'],
    pmids: ['PMID: 9383962'],
    doi: '10.1016/S0960-0760(97)00067-1',
    scaffold: 'Isoflavone',
    description: 'Isoflavone phytoestrogen displaying high binding affinity for estrogen receptors and selective tyrosine kinase inhibition.'
  },
  {
    id: 'NAT-011',
    name: 'Piperine',
    iupac: '(2E,4E)-5-(1,3-benzodioxol-5-yl)-1-piperidin-1-ylpenta-2,4-dien-1-one',
    formula: 'C17H19NO3',
    smiles: 'C1CCN(CC1)C(=O)C=CC=CC2=CC3=C(C=C2)OCO3',
    sourcePlant: 'Piper nigrum',
    commonPlantName: 'Black Pepper',
    plantFamily: 'Piperaceae',
    plantPart: 'Fruit',
    biologicalActivities: ['Bioavailability Enhancer', 'Thermo-nutrient Modulator'],
    targets: [
      { gene: 'TRPV1', name: 'Transient Receptor Potential Vanilloid 1', affinity: '0.35 µM', pIC50: 6.46, type: 'Agonist' }
    ],
    pathways: ['TRPV1 Nociceptive Activation', 'Hepatic Glucuronidation Suppression'],
    diseaseIndications: ['Nutrient Malabsorption', 'Neuropathic Pain'],
    pmids: ['PMID: 21434858'],
    doi: '10.1002/ptr.3586',
    scaffold: 'Piperidine Alkaloid',
    description: 'Alkaloid responsible for the pungency of black pepper. Inhibits hepatic glucuronidation to boost natural compound bioavailability.'
  },
  {
    id: 'NAT-012',
    name: 'Celastrol',
    iupac: '3-hydroxy-9,13-dimethyl-2-oxo-24-norchola-1(10),3,5,7-tetraen-23-oic acid',
    formula: 'C29H38O4',
    smiles: 'CC1(C2CCC3(C(C2(CCC1O)C)C=C4C(=C3)C(=O)C(=CC4=O)O)C)C(=O)O',
    sourcePlant: 'Tripterygium wilfordii',
    commonPlantName: 'Thunder God Vine',
    plantFamily: 'Celastraceae',
    plantPart: 'Root Bark',
    biologicalActivities: ['Leptin Sensitizer', 'Hsp90 Inhibitor', 'Anti-obesity'],
    targets: [
      { gene: 'HSP90AA1', name: 'Heat Shock Protein 90 Alpha', affinity: '0.18 µM', pIC50: 6.74, type: 'Inhibitor' }
    ],
    pathways: ['Hsp90-Cdc37 Chaperone Complex Disruption'],
    diseaseIndications: ['Severe Obesity', 'Rheumatoid Arthritis'],
    pmids: ['PMID: 26004070'],
    doi: '10.1016/j.cell.2015.05.011',
    scaffold: 'Pentacyclic Triterpenoid Quinone Methide',
    description: 'Pentacyclic triterpenoid quinone methide functioning as a powerful leptin sensitizer and inhibitor of heat shock protein 90.'
  }
];

export const ENRICHED_DB = PHYTOCHEMICALS_DB.map(c => {
  const desc = calculateDescriptorsFromSMILES(c.smiles);
  return { ...c, ...desc };
});

export const TARGET_MODELS = [
  { id: 'PTGS2', name: 'Cyclooxygenase-2 (COX-2)', category: 'Inflammation' },
  { id: 'NFKB1', name: 'Nuclear Factor Kappa B (NF-kB)', category: 'Inflammation' },
  { id: 'EGFR', name: 'Epidermal Growth Factor Receptor (EGFR)', category: 'Oncology' },
  { id: 'AChE', name: 'Acetylcholinesterase (AChE)', category: 'Neuroscience' },
  { id: 'KEAP1', name: 'Kelch-like ECH Protein 1 (Keap1)', category: 'Antioxidant' },
  { id: 'SIRT1', name: 'Sirtuin-1 Deacetylase (SIRT1)', category: 'Metabolism' }
];
