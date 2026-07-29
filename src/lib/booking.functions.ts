import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "./stripe.server";

const DEPOSIT_CENTS = 10000; // $100 flat deposit

const draftSchema = z.object({
  client_name: z.string().min(2).max(120),
  client_email: z.string().email().max(255),
  phone: z.string().max(40).optional().nullable(),
  concept: z.string().min(10).max(4000),
  size_estimate: z.string().max(120).optional().nullable(),
  placement: z.string().max(120).optional().nullable(),
  body_location: z.string().max(120).optional().nullable(),
  session_length: z.string().max(60).optional().nullable(),
  preferred_date: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

type CheckoutResult = { clientSecret: string; bookingId: string } | { error: string };

export const startDepositCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: {
    booking: z.infer<typeof draftSchema>;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    draftSchema.parse(input.booking);
    return input;
  })
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const b = data.booking;

    // Insert booking draft (deposit_paid=false)
    const { data: booking, error: insertError } = await supabaseAdmin
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
        session_length: b.session_length || null,
        preferred_date: b.preferred_date || null,
        deposit_amount_cents: DEPOSIT_CENTS,
        deposit_paid: false,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !booking) {
      return { error: insertError?.message ?? "Failed to create booking" };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Tattoo Deposit — Shyftd Ink",
                description: "Non-refundable booking deposit. Applied to your final session total.",
              },
              unit_amount: DEPOSIT_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: `${data.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        customer_email: b.client_email,
        payment_intent_data: { description: "Tattoo Deposit — Shyftd Ink" },
        metadata: {
          booking_id: booking.id as string,
          kind: "tattoo_deposit",
        },
      });

      await supabaseAdmin
        .from("bookings")
        .update({ stripe_session_id: session.id })
        .eq("id", booking.id as string);

      return {
        clientSecret: session.client_secret ?? "",
        bookingId: booking.id as string,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
