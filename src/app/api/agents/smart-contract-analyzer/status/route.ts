import { NextRequest } from 'next/server';
import { createProtectedApiHandler } from '@/lib/api-handler';
import { Orchestrator } from '@/ai/orchestration/Orchestrator';
import { ApiError } from '@/lib/api-handler';

// GET /api/agents/smart-contract-analyzer/status
export const GET = createProtectedApiHandler({
  handler: async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      throw new ApiError('MISSING_PARAMETER', 'Analysis ID is required', 400);
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
    // @ts-expect-error: Assume agent has getAnalysisStatus for now
    const status = await agent.getAnalysisStatus(analysisId);
    if (!status) {
      throw new ApiError('NOT_FOUND', 'Analysis not found', 404);
    }

    return status;
  },
}); 