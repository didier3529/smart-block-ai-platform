import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[SETTINGS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const settings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id
      },
      update: body,
      create: {
        userId: session.user.id,
        ...body
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[SETTINGS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 