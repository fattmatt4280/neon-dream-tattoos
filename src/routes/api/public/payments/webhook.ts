import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { sendTransactionalEmail } from "@/lib/email";
import { BOOKING_TYPE_LABELS, type BookingType } from "@/lib/booking.functions";

const NOTIFY_EMAIL = "shyftd.ink@gmail.com";

async function markBookingPaid(session: any) {
  const bookingId = session.metadata?.booking_id as string | undefined;
  if (!bookingId) {
    console.error("checkout.session.completed with no booking_id metadata", session.id);
    return;
  }
  if (session.payment_status === "unpaid") return;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .update({
      deposit_paid: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (error || !booking) {
    console.error("Failed to update booking on webhook", error);
    return;
  }

  await sendTransactionalEmail({
    templateName: "booking-notification",
    recipientEmail: NOTIFY_EMAIL,
    idempotencyKey: `booking-paid-${bookingId}`,
    templateData: {
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      phone: booking.phone,
      concept: booking.concept,
      bodyLocation: booking.body_location,
      bookingType: booking.booking_type ? BOOKING_TYPE_LABELS[booking.booking_type as BookingType] : undefined,
      preferredDate: booking.preferred_date,
      bookingId,
      depositPaid: true,
    },
  });
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
