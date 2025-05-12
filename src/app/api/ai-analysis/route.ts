import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AIAnalysisRequest } from '@/lib/services/ai-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Note: Not NEXT_PUBLIC_
});

export async function POST(request: Request) {
  try {
    const data: AIAnalysisRequest = await request.json();
    
    const systemPrompt = getSystemPrompt(data.type);
    const userPrompt = JSON.stringify(data.data, null, 2);

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    return NextResponse.json({
      analysis: message.content[0].text,
      recommendations: [],
      confidence: 0.8
    });
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(type: string): string {
  const prompts = {
    portfolio: 'You are an expert portfolio analyst AI. Analyze the portfolio data and provide insights on performance, risk, and opportunities.',
    market: 'You are an expert market analyst AI. Analyze market trends, patterns, and provide trading insights.',
    contract: 'You are an expert smart contract auditor AI. Analyze smart contracts for security vulnerabilities and optimization opportunities.',
    nft: 'You are an expert NFT analyst AI. Analyze NFT collections, rarity, and market trends.'
  };
  return prompts[type] || prompts.portfolio;
} 