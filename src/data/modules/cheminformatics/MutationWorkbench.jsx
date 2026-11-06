import React, { useState } from 'react';
import { SAMPLE_COMPOUNDS } from '../../data/compoundsData';

export function MutationWorkbench() {
  const [smiles, setSmiles] = useState(SAMPLE_COMPOUNDS[0].smiles);
  const [selectedGroup, setSelectedGroup] = useState("-OH");

}