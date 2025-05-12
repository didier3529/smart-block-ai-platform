import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AI_CONFIG } from "@/config/ai-config"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { provider, apiKey } = await request.json()

    // Validate the provider
    if (!['openai', 'anthropic', 'perplexity'].includes(provider)) {
      return new NextResponse("Invalid provider", { status: 400 })
    }

    // Validate the API key
    if (!apiKey || typeof apiKey !== 'string') {
      return new NextResponse("Invalid API key", { status: 400 })
    }

    // Update the environment variable
    switch (provider) {
      case 'openai':
        process.env.OPENAI_API_KEY = apiKey
        process.env.NEXT_PUBLIC_AI_API_KEY = apiKey
        break
      case 'anthropic':
        process.env.ANTHROPIC_API_KEY = apiKey
        break
      case 'perplexity':
        process.env.PERPLEXITY_API_KEY = apiKey
        break
    }

    // Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AI_CONFIG_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 