import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("[GET /api/prospects/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch prospect" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const body = await req.json();

    const allowedFields = [
      "status",
      "notes",
      "priority",
      "estimatedValue",
      "followUpDate",
      "convertedAt",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    const prospect = await prisma.prospect.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("[PATCH /api/prospects/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update prospect" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await prisma.prospect.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/prospects/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete prospect" },
      { status: 500 }
    );
  }
}
