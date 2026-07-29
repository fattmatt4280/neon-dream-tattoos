import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { startDepositCheckout } from "@/lib/booking.functions";

export function DepositCheckout({
  booking,
  onError,
}: {
  booking: Parameters<typeof startDepositCheckout>[0]["data"]["booking"];
  onError: (msg: string) => void;
}) {
  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/book/success`;
    const result = await startDepositCheckout({
      data: { booking, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) {
      onError(result.error);
      throw new Error(result.error);
    }
    if (!result.clientSecret) {
      onError("Stripe did not return a client secret");
      throw new Error("No client secret");
    }
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
