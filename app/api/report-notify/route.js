import { Resend } from "resend";

export async function POST(req) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await req.json();
  const report = body.record; // Supabase Webhookが送ってくるINSERTされた行

  try {
    await resend.emails.send({
      from: "Stamps. <notify@stampsjp.com>",
      to: process.env.CONTACT_EMAIL,
      subject: "【Stamps.】新しい通報がありました",
      text: `通報がありました。

対象タイプ: ${report.target_type}
対象ID: ${report.target_id}
理由: ${report.reason || "未記入"}
通報者ID: ${report.reporter_id}
日時: ${report.created_at}

Supabaseダッシュボードの reports テーブルで確認してください。`
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}