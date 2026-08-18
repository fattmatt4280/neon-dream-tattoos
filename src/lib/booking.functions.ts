import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "./stripe.server";
import { sendTransactionalEmail } from "./email";

export const BOOKING_TYPES = ["smaller_tattoo", "half_day", "whole_day", "multiple_days", "consultation"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  smaller_tattoo: "Smaller tattoo",
  half_day: "Half day",
  whole_day: "Whole day",
  multiple_days: "Multiple days",
  consultation: "Consultation",
};

// Fixed deposit tiers in cents. "multiple_days" has no fixed tier — an admin
// must set a custom amount on the booking (in /studio/bookings) before it
// can be approved.
export const FIXED_DEPOSIT_CENTS: Partial<Record<BookingType, number>> = {
  smaller_tattoo: 5000,
  half_day: 10000,
  whole_day: 20000,
  consultation: 0,
};

const NOTIFY_EMAIL = "shyftd.ink@gmail.com";

const draftSchema = z.object({
  client_name: z.string().min(2).max(120),
  client_email: z.string().email().max(255),
  phone: z.string().max(40).optional().nullable(),
  concept: z.string().min(10).max(4000),
  size_estimate: z.string().max(120).optional().nullable(),
  placement: z.string().max(120).optional().nullable(),
  body_location: z.string().max(120).optional().nullable(),
  booking_type: z.enum(BOOKING_TYPES),
  preferred_date: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

function fmtDeposit(cents: number | null): string {
  if (cents === null) return "Custom — set an amount in /studio/bookings before approving";
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

type SubmitResult = { bookingId: string } | { error: string };

// Every booking now goes through approval: the client submits a request (no
// payment yet), Matt gets emailed, and reviews it in /studio/bookings.
export const submitBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((input: { booking: z.infer<typeof draftSchema> }) => {
    draftSchema.parse(input.booking);
    return input;
  })
  .handler(async ({ data }): Promise<SubmitResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const b = data.booking;
    const depositCents = FIXED_DEPOSIT_CENTS[b.booking_type] ?? null;

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: b.user_id ?? null,
        client_name: b.client_name,
        client_email: b.client_email,
        phone: b.phone || null,
        concept: b.concept,
        size_estimate: b.size_estimate || null,
        placement: b.placement || null,
        body_location: b.body_location || null,
        booking_type: b.booking_type,
        preferred_date: b.preferred_date || null,
        deposit_amount_cents: depositCents,
        deposit_paid: false,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !booking) {
      return { error: error?.message ?? "Failed to create booking" };
    }

    const bookingId = booking.id as string;

    await sendTransactionalEmail({
      templateName: "booking-notification",
      recipientEmail: NOTIFY_EMAIL,
      idempotencyKey: `booking-request-${bookingId}`,
      templateData: {
        clientName: b.client_name,
        clientEmail: b.client_email,
        phone: b.phone,
        concept: b.concept,
        bodyLocation: b.body_location,
        bookingType: BOOKING_TYPE_LABELS[b.booking_type],
        depositAmount: fmtDeposit(depositCents),
        preferredDate: b.preferred_date,
        bookingId,
        needsApproval: true,
      },
    });

    return { bookingId };
  });

type ApproveResult = { paymentLinkUrl: string | null } | { error: string };

// Approving a booking either confirms it outright (free consultations, no
// payment needed) or creates a hosted Stripe checkout session for the
// deposit and emails the client a pay link. Admin-gated: verifies the
// caller's access token belongs to an admin before doing anything.
export const approveBooking = createServerFn({ method: "POST" })
  .inputValidator((input: { bookingId: string; accessToken: string; environment: StripeEnv }) => input)
  .handler(async ({ data }): Promise<ApproveResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (userErr || !userData.user) return { error: "Not signed in" };
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return { error: "Not authorized" };

    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", data.bookingId)
      .single();
    if (fetchErr || !booking) return { error: "Booking not found" };
    if (booking.status !== "pending") return { error: `Booking is already ${booking.status}` };

    const depositCents = booking.deposit_amount_cents;
    const bookingType = booking.booking_type as BookingType | null;
    const typeLabel = bookingType ? BOOKING_TYPE_LABELS[bookingType] : "Tattoo";

    // Free (consultations): confirm directly, no payment involved.
    if (depositCents === 0) {
      await supabaseAdmin.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);
      await sendTransactionalEmail({
        templateName: "booking-confirmed",
        recipientEmail: booking.client_email,
        idempotencyKey: `booking-confirmed-${booking.id}`,
        templateData: { clientName: booking.client_name, bookingType: typeLabel },
      });
      return { paymentLinkUrl: null };
    }

    if (depositCents === null || depositCents === undefined) {
      return { error: "Set a deposit amount before approving this booking" };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const origin = process.env.SITE_ORIGIN ?? "http://localhost:8080";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${typeLabel} Deposit — Shyftd Ink`,
                description: "Non-refundable booking deposit. Applied to your final session total.",
              },
              unit_amount: depositCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/book/cancel`,
        customer_email: booking.client_email,
        payment_intent_data: { description: `${typeLabel} Deposit — Shyftd Ink` },
        metadata: { booking_id: booking.id as string, kind: "tattoo_deposit" },
      });

      const paymentLinkUrl = session.url ?? null;

      await supabaseAdmin
        .from("bookings")
        .update({ status: "confirmed", stripe_session_id: session.id, payment_link_url: paymentLinkUrl })
        .eq("id", booking.id);

      await sendTransactionalEmail({
        templateName: "deposit-payment-link",
        recipientEmail: booking.client_email,
        idempotencyKey: `deposit-link-${booking.id}`,
        templateData: {
          clientName: booking.client_name,
          bookingType: typeLabel,
          depositAmount: fmtDeposit(depositCents),
          paymentLinkUrl,
        },
      });

      return { paymentLinkUrl };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
