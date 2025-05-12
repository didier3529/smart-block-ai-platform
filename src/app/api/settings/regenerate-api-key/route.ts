import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const newApiKey = `sk-${uuidv4()}`
    const settings = await prisma.userSettings.update({
      where: {
        userId: session.user.id
      },
      data: {
        apiKeys: {
          key: newApiKey,
          lastGenerated: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({ key: newApiKey })
  } catch (error) {
    console.error("[API_KEY_REGENERATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 