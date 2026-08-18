// Thin wrapper around Lovable's transactional email API. Failures are logged
// and swallowed — a booking/approval action should never fail just because
// the notification email didn't go out.
export async function sendTransactionalEmail(params: {
  templateName: string;
  recipientEmail: string;
  idempotencyKey: string;
  templateData: Record<string, unknown>;
}): Promise<void> {
  const origin = process.env.SITE_ORIGIN ?? "http://localhost:8080";
  try {
    const res = await fetch(`${origin}/lovable/email/transactional/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      console.error(`Email send failed: ${params.templateName}`, res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error(`Email send failed (non-fatal): ${params.templateName}`, e);
  }
}
