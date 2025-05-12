import { useState } from 'react';

export function useNFTEvaluation() {
  // Mock data for recent evaluations
  const [recentEvaluations] = useState([
    {
      collection: 'Bored Ape Yacht Club',
      score: 92,
      risk: 'Low',
      timestamp: '2h ago',
    },
    {
      collection: 'CryptoPunks',
      score: 85,
      risk: 'Medium',
      timestamp: '5h ago',
    },
    {
      collection: 'Azuki',
      score: 70,
      risk: 'High',
      timestamp: '1d ago',
    },
  ]);

  return { recentEvaluations };
} 