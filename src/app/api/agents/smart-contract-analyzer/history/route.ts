import { NextRequest } from 'next/server';
import { createProtectedApiHandler } from '@/lib/api-handler';
import { HistoryQuerySchema } from '@/types/api';
import { Orchestrator } from '@/ai/orchestration/Orchestrator';

// GET /api/agents/smart-contract-analyzer/history
export const GET = createProtectedApiHandler({
  handler: async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    
    // Parse and validate query parameters
    const query = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      status: searchParams.get('status'),
    };

    // Validate query parameters
    try {
      HistoryQuerySchema.parse(query);
    } catch (error) {
      throw new Error('Invalid query parameters');
    }

    const orchestrator = new Orchestrator({
      maxConcurrentAgents: 5,
      defaultTimeout: 30000,
      retryStrategy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 }
    });
    const agent = orchestrator.getAgent('SmartContractAnalyzer');
    if (!agent) {
      return new Response(JSON.stringify({ error: 'SmartContractAnalyzer agent not found' }), { status: 404 });
    }
    // @ts-expect-error: Assume agent has getAnalysisHistory for now
    return agent.getAnalysisHistory(query);
  },
}); 