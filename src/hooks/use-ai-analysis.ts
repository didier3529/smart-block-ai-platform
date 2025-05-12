import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AIService, AIAnalysisRequest, AIAnalysisResponse } from '@/lib/services/ai-service';
import { AIAnalysisResult } from '@/types/ai';

interface UseAIAnalysisOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useAIAnalysis(request: AIAnalysisRequest, options: UseAIAnalysisOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const aiService = AIService.getInstance();

  const {
    data: analysis,
    isLoading,
    error,
    refetch
  } = useQuery<AIAnalysisResponse>({
    queryKey: ['ai-analysis', request.type, JSON.stringify(request.data)],
    queryFn: async () => {
      try {
        return await aiService.analyzeData(request);
      } catch (error: any) {
        if (error.message && error.message.includes('AI API key not configured')) {
          if (process.env.NODE_ENV === 'production') {
            throw error;
          }
          // Provide mock data in development
          return {
            analysis: 'This is mock AI analysis data for development purposes.',
            recommendations: ['Consider diversifying into stable assets', 'Monitor emerging trends in DeFi'],
            riskScore: 65,
            confidence: 0.8,
          };
        }
        throw error;
      }
    },
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  return {
    analysis,
    isLoading,
    error,
    refetch,
    isStreaming
  };
} 