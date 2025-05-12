import { useLocalStorage } from './useLocalStorage';
import { AGENT_DETAILS } from '@/components/guides/AIAgentSelectionGuide';

export interface UseSelectedAgentsReturn {
  selectedAgents: string[];
  addAgent: (agentId: string) => void;
  removeAgent: (agentId: string) => void;
  clearAgents: () => void;
  isAgentSelected: (agentId: string) => boolean;
  getSelectedAgentDetails: () => typeof AGENT_DETAILS;
  getRecommendedAgents: () => typeof AGENT_DETAILS;
}

export function useSelectedAgents(): UseSelectedAgentsReturn {
  const [selectedAgents, setSelectedAgents] = useLocalStorage<string[]>('selectedAgents', []);

  const addAgent = (agentId: string) => {
    if (!selectedAgents.includes(agentId)) {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const removeAgent = (agentId: string) => {
    setSelectedAgents(selectedAgents.filter((id: string) => id !== agentId));
  };

  const clearAgents = () => {
    setSelectedAgents([]);
  };

  const isAgentSelected = (agentId: string) => {
    return selectedAgents.includes(agentId);
  };

  const getSelectedAgentDetails = () => {
    return AGENT_DETAILS.filter((agent) => selectedAgents.includes(agent.id));
  };

  const getRecommendedAgents = () => {
    // Get all complementary agents for currently selected agents
    const recommendedIds = new Set<string>();
    selectedAgents.forEach((selectedId: string) => {
      const agent = AGENT_DETAILS.find((a) => a.id === selectedId);
      agent?.complementaryAgents.forEach((complementaryId: string) => {
        if (!selectedAgents.includes(complementaryId)) {
          recommendedIds.add(complementaryId);
        }
      });
    });

    return AGENT_DETAILS.filter((agent) => recommendedIds.has(agent.id));
  };

  return {
    selectedAgents,
    addAgent,
    removeAgent,
    clearAgents,
    isAgentSelected,
    getSelectedAgentDetails,
    getRecommendedAgents,
  };
} 