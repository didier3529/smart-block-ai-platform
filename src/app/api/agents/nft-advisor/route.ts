import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createProtectedApiHandler } from '@/lib/api-handler';
import { AnalysisRequestSchema } from '@/types/api';
import { Orchestrator } from '@/ai/orchestration/Orchestrator';
import { ApiError } from '@/lib/api-handler';

// Extend base analysis schema for NFTAdvisor
const NFTAdvisorRequestSchema = AnalysisRequestSchema.extend({
  data: z.object({
    collectionAddress: z.string(),
    network: z.enum(['ethereum', 'polygon', 'bsc']),
    analysisTypes: z.array(z.enum([
      'rarity',
      'market-trends',
      'price-prediction',
      'liquidity',
      'community-metrics'
    ])),
    tokenId: z.string().optional(),
  }),
});

// GET /api/agents/nft-advisor/insights
export const GET = createProtectedApiHandler({
  handler: async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const collectionAddress = searchParams.get('collectionAddress');
    const network = searchParams.get('network');
    const tokenId = searchParams.get('tokenId');

    if (!collectionAddress || !network) {
      throw new ApiError('MISSING_PARAMETER', 'Collection address and network are required', 400);
    }

    const orchestrator = new Orchestrator({
      maxConcurrentAgents: 5,
      defaultTimeout: 30000,
      retryStrategy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 }
    });
    const agent = orchestrator.getAgent('NFTAdvisor');
    if (!agent) {
      return new Response(JSON.stringify({ error: 'NFTAdvisor agent not found' }), { status: 404 });
    }
    // @ts-expect-error: Assume agent has getInsights for now
    return agent.getInsights({ collectionAddress, network, tokenId });
  },
});

// POST /api/agents/nft-advisor/analyze
export const POST = createProtectedApiHandler({
  validationSchema: NFTAdvisorRequestSchema,
  handler: async (req: NextRequest, context) => {
    const body = await req.json();
    
    const orchestrator = new Orchestrator({
      maxConcurrentAgents: 5,
      defaultTimeout: 30000,
      retryStrategy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 }
    });
    const agent = orchestrator.getAgent('NFTAdvisor');
    if (!agent) {
      return new Response(JSON.stringify({ error: 'NFTAdvisor agent not found' }), { status: 404 });
    }
    // @ts-expect-error: Assume agent has analyze for now
    return agent.analyze(body.data, body.options);
  },
}); 