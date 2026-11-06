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

  }
}