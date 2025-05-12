import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createProtectedApiHandler } from '@/lib/api-handler';
import { AnalysisRequestSchema, HistoryQuerySchema } from '@/types/api';
import { Orchestrator } from '@/ai/orchestration/Orchestrator';

// Extend base analysis schema for TrendSpotter
const TrendSpotterRequestSchema = AnalysisRequestSchema.extend({
  data: z.object({
    tokens: z.array(z.string()),
    timeframe: z.enum(['1h', '24h', '7d', '30d']),
    indicators: z.array(z.enum(['price', 'volume', 'social', 'technical'])),
  }),
});

// GET /api/agents/trend-spotter/insights
export const GET = createProtectedApiHandler({
  handler: async (req: NextRequest, context) => {
    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const token = searchParams.get('token');
    const timeframe = searchParams.get('timeframe') as '1h' | '24h' | '7d' | '30d';

    if (!token || !timeframe) {
      throw new Error('Missing required parameters');
    }

    const orchestrator = new Orchestrator({
      maxConcurrentAgents: 5,
      defaultTimeout: 30000,
      retryStrategy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 }
    });
    const agent = orchestrator.getAgent('TrendSpotter');
    if (!agent) {
      return new Response(JSON.stringify({ error: 'TrendSpotter agent not found' }), { status: 404 });
    }
    // @ts-expect-error: Assume agent has getInsights for now
    return agent.getInsights({ token, timeframe });
  },
});

// POST /api/agents/trend-spotter/analyze
export const POST = createProtectedApiHandler({
  validationSchema: TrendSpotterRequestSchema,
  handler: async (req: NextRequest, context) => {
    const body = await req.json();
    
    const orchestrator = new Orchestrator({
      maxConcurrentAgents: 5,
      defaultTimeout: 30000,
      retryStrategy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 10000, backoffMultiplier: 2 }
    });
    const agent = orchestrator.getAgent('TrendSpotter');
    if (!agent) {
      return new Response(JSON.stringify({ error: 'TrendSpotter agent not found' }), { status: 404 });
    }
    // @ts-expect-error: Assume agent has analyze for now
    return agent.analyze(body.data, body.options);
  },
}); 