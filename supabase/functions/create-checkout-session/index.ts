import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same Stripe account/prices as fattmatt.me
const PRICE_IDS: Record<string, string> = {
  "half-day": "price_1TWGyFRzfwe0oZX3gVifyTX0", // $100
  "full-day": "price_1TWGywRzfwe0oZX3kFG2tJwu", // $200
};

interface CheckoutRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  bodyLocation: string;
  consultType: string;
  sessionLength?: string;
  flashId?: string;
  flashTitle?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    }: CheckoutRequest = await req.json();

    console.log("Creating checkout session for:", { name, email, consultType, sessionLength });

    const priceId = PRICE_IDS[sessionLength || "half-day"] || PRICE_IDS["half-day"];

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/book`,
      customer_email: email,
      metadata: {
        name,
        email,
        phone: phone || "",
        message,
        bodyLocation,
        consultType,
        sessionLength: sessionLength || "half-day",
        flashId: flashId || "",
        flashTitle: flashTitle || "",
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
