import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const settings = await prisma.userSettings.update({
      where: {
        userId: session.user.id
      },
      data: {
        security: {
          ...body
        }
      }
    })

    return NextResponse.json(settings.security)
  } catch (error) {
    console.error("[SECURITY_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 