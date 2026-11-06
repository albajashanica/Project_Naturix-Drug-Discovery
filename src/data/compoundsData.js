export const SAMPLE_COMPOUNDS = [
  {
    id: "NAT-001",
    name: "Curcumin",
    formula: "C21H20O6",
    mw: 368.38,
    smiles: "O=C(\\C=C\\c1ccc(O)c(OC)c1)CC(=O)\\C=C\\c2ccc(O)c(OC)c2",
    plant: "Curcuma longa",
    family: "Zingiberaceae",
    activities: ["Anti-inflammatory", "Antioxidant", "Neuroprotective"],
    target: "COX-2 / NF-kB",
    logp: 3.2,
    tpsa: 93.1,
    hbd: 2,
    hba: 6,
    rotb: 8,
    pmid: "PMID: 17569207",
    doi: "10.1021/jm070273+"
  },
  
  {
    id: "NAT-002",
    name: "Resveratrol",
    formula: "C14H12O3",
    mw: 228.24,
    smiles: "Oc1ccc(\\C=C\\c2cc(O)cc(O)c2)cc1",
    plant: "Vitis vinifera",
    family: "Vitaceae",
    activities: ["Sirtuin activator", "Cardioprotective", "Longevity"],
    target: "SIRT1",
    logp: 3.1,
    tpsa: 60.7,
    hbd: 3,
    hba: 3,
    rotb: 2,
    pmid: "PMID: 14504319",
    doi: "10.1038/nature01960"
  },

  {
    id: "NAT-003",
    name: "Artemisinin",
    formula: "C15H22O5",
    mw: 282.33,
    smiles: "CC1CCC2C(C)(C1)C3CCC4(C)OO C23OO4",
    plant: "Artemisia annua",
    family: "Asteraceae",
    activities: ["Antimalarial", "Anticancer activity"],
    target: "PfATP6",
    logp: 2.9,
    tpsa: 53.9,
    hbd: 0,
    hba: 5,
    rotb: 0,
    pmid: "PMID: 26568249",
    doi: "10.1038/nature15744"
  }

];