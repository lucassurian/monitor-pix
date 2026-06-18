import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removerComprovante } from "@/lib/store";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  removerComprovante(params.id);
  return NextResponse.json({ ok: true });
}
