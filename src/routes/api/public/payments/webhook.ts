import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

const NOTIFY_EMAIL = "shyftd.ink@gmail.com";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function markBookingPaid(session: any) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.error("checkout.session.completed with no booking_id metadata", session.id);
    return;
  }
  if (session.payment_status === "unpaid") return; // async payment method — wait for settlement

  const { data: booking, error } = await getSupabase()
    .from("bookings")
    .update({
      deposit_paid: true,
      status: "deposit_paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update booking on webhook", error);
    return;
  }

  // Best-effort notification. Requires Lovable Emails to be set up.
  // Falls through silently if not yet configured so the webhook still 200s.
  try {
    const origin = process.env.SITE_ORIGIN ?? "http://localhost:8080";
    await fetch(`${origin}/lovable/email/transactional/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        templateName: "booking-notification",
        recipientEmail: NOTIFY_EMAIL,
        idempotencyKey: `booking-${bookingId}`,
        templateData: {
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          phone: booking.phone,
          concept: booking.concept,
          bodyLocation: booking.body_location,
          sessionLength: booking.session_length,
          preferredDate: booking.preferred_date,
          bookingId,
        },
      }),
    });
  } catch (e) {
    console.error("Booking notification email failed (non-fatal)", e);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await markBookingPaid(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      console.warn("Deposit payment failed", event.data.object.id);
      break;
    default:
      // Ignore other events (subscription.* etc are not used here)
      break;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
