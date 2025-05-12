import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createProtectedApiHandler } from '@/lib/api-handler';
import { AnalysisRequestSchema } from '@/types/api';
import { Orchestrator } from '@/ai/orchestration/Orchestrator';
import { ApiError } from '@/lib/api-handler';

// Extend base analysis schema for SmartContractAnalyzer
const SmartContractAnalyzerRequestSchema = AnalysisRequestSchema.extend({
  data: z.object({
    contractAddress: z.string(),
    network: z.enum(['ethereum', 'polygon', 'bsc']),
    analysisTypes: z.array(z.enum([
      'security',
      'gas-optimization',
      'best-practices',
      'upgradability'
    ])),
  }),
});

// GET /api/agents/smart-contract-analyzer/insights
export const GET = createProtectedApiHandler({
  handler: async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const contractAddress = searchParams.get('contractAddress');
    const network = searchParams.get('network');

    if (!contractAddress || !network) {
      throw new ApiError('MISSING_PARAMETER', 'Contract address and network are required', 400);
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
    // @ts-expect-error: Assume agent has getInsights for now
    return agent.getInsights({ contractAddress, network });
  },
});

// POST /api/agents/smart-contract-analyzer/analyze
export const POST = createProtectedApiHandler({
  validationSchema: SmartContractAnalyzerRequestSchema,
  handler: async (req: NextRequest, context) => {
    const body = await req.json();
    
    const orchestrator = new Orchestrator({
      maxConcurrentAgents: 5,
      defaultTimeout: 30000,
      retryStrategy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 }
    });
    const agent = orchestrator.getAgent('SmartContractAnalyzer');
    if (!agent) {
      return new Response(JSON.stringify({ error: 'SmartContractAnalyzer agent not found' }), { status: 404 });
    }
    // @ts-expect-error: Assume agent has analyze for now
    return agent.analyze(body.data, body.options);
  },
}); 