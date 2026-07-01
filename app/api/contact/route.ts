import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { purpose, name, email, message } = await req.json();
  try {
    await resend.emails.send({
      from: "Stamps. <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL!,
      subject: `[Stamps.お問い合わせ] ${purpose}`,
      text: `目的: ${purpose}\nお名前: ${name||"未入力"}\nメール: ${email||"未入力"}\n\n${message}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}