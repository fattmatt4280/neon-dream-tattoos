import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe signature found");
      return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret || "");
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Checkout completed for session:", session.id);

      const {
        name,
        email,
        phone,
        message,
        bodyLocation,
        consultType,
        sessionLength,
        flashId,
        flashTitle,
      } = session.metadata || {};

      if (!name || !email) {
        console.error("Missing required metadata");
        return new Response("Missing metadata", { status: 400 });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Record the paid booking request
      const concept = flashId ? `[Flash claim: ${flashTitle || flashId}] ${message}` : message;

      const { error: insertError } = await supabase.from("bookings").insert({
        client_name: name,
        client_email: email,
        phone: phone || null,
        concept,
        body_location: bodyLocation || null,
        session_length: sessionLength || null,
        stripe_session_id: session.id,
        deposit_paid: true,
        status: "pending",
      });

      if (insertError) {
        console.error("Error inserting booking:", insertError);
        throw insertError;
      }

      // 2. Send booking confirmation email
      const { error: emailError } = await supabase.functions.invoke("send-booking-email", {
        body: {
          name,
          email,
          message,
          consultType,
          paymentConfirmed: true,
          stripeSessionId: session.id,
        },
      });

      if (emailError) {
        console.error("Error sending booking email:", emailError);
        throw emailError;
      }

      console.log("Booking email sent successfully");

      // 3. Register consultation in dream-bookings so agents + calendar can see it
      const dreamBookingsUrl = Deno.env.get("DREAM_BOOKINGS_API_URL");
      const dreamBookingsKey = Deno.env.get("DREAM_BOOKINGS_INTERNAL_KEY");

      if (dreamBookingsUrl && dreamBookingsKey) {
        try {
          const dbRes = await fetch(`${dreamBookingsUrl}/api/consultations/from-stripe`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": dreamBookingsKey,
            },
            body: JSON.stringify({
              artistId: "shyftd-ink",
              stripeSessionId: session.id,
              name,
              email,
              phone: phone || null,
              message: message || null,
              bodyLocation: bodyLocation || null,
              consultType: consultType || null,
            }),
          });
          if (dbRes.ok) {
            const dbData = await dbRes.json();
            console.log("Dream-bookings consultation created:", dbData.consultationId);
          } else {
            console.error("Dream-bookings registration failed:", await dbRes.text());
          }
        } catch (dbErr) {
          // Non-fatal — booking already recorded, don't fail the webhook
          console.error("Dream-bookings call error (non-fatal):", dbErr);
        }
      } else {
        console.log("DREAM_BOOKINGS_API_URL not set — skipping calendar registration");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
