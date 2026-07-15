import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type WidgetStep = "idle" | "name" | "email" | "description" | "submitting" | "done" | "error";

type Props = {
  artistId?: string;
  accentColor?: string;
  ctaLabel?: string;
  /** DreamBookings API base URL. Defaults to localhost for local dev. */
  apiUrl?: string;
};

const DEFAULT_API_URL = import.meta.env?.VITE_DREAM_BOOKINGS_URL || "http://localhost:3001";

export function DreamBookingWidget({
  artistId = "demo",
  accentColor = "#ff00ff",
  ctaLabel = "Book a Consultation",
  apiUrl = DEFAULT_API_URL,
}: Props) {
  const [step, setStep] = useState<WidgetStep>("idle");
  const [formData, setFormData] = useState({ name: "", email: "", description: "" });
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStart = () => setStep("name");

  const handleNext = (field: keyof typeof formData, value: string, next: WidgetStep) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStep(next);
  };

  const handleSubmit = async (description: string) => {
    const finalData = { ...formData, description };
    setFormData(finalData);
    setStep("submitting");
    try {
      const res = await fetch(`${apiUrl}/consultations/quick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, ...finalData }),
      });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setConsultationId(json.consultationId ?? null);
      setStep("done");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="w-full max-w-sm border border-border bg-card p-6 font-sans">
      {step === "idle" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Ready to book?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Takes 2 minutes. AI matches your idea to the portfolio.
            </p>
          </div>
          <Button
            onClick={handleStart}
            style={{ backgroundColor: accentColor }}
            className="w-full text-white hover:opacity-90"
          >
            {ctaLabel}
          </Button>
        </div>
      )}

      {step === "name" && (
        <StepInput
          label="What's your name?"
          placeholder="Jane Doe"
          buttonLabel="Next"
          accentColor={accentColor}
          onSubmit={(val) => handleNext("name", val, "email")}
        />
      )}

      {step === "email" && (
        <StepInput
          label="Your email"
          placeholder="jane@example.com"
          inputType="email"
          buttonLabel="Next"
          accentColor={accentColor}
          onSubmit={(val) => handleNext("email", val, "description")}
        />
      )}

      {step === "description" && (
        <StepTextarea
          label="Describe your tattoo idea"
          placeholder="A neon serpent coiled around a peony, color realism..."
          buttonLabel="Get AI Match"
          accentColor={accentColor}
          onSubmit={handleSubmit}
        />
      )}

      {step === "submitting" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${accentColor}40`, borderTopColor: "transparent" }}
          />
          <p className="text-sm text-muted-foreground">Analyzing your vision...</p>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-3">
          <div className="border border-acid bg-acid/10 px-4 py-3 text-sm text-acid">
            Match report ready! Check your email for the full breakdown.
          </div>
          {consultationId && (
            <a
              href={`/book?consultationId=${consultationId}`}
              style={{ backgroundColor: accentColor }}
              className="block w-full px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Choose a Date &amp; Pay Deposit
            </a>
          )}
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <button
            onClick={() => setStep("idle")}
            className="text-sm underline text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function StepInput({
  label,
  placeholder,
  buttonLabel,
  inputType = "text",
  accentColor,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  buttonLabel: string;
  inputType?: string;
  accentColor: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-foreground">{label}</Label>
      <Input
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="bg-muted/50 border-border"
        onKeyDown={(e) => e.key === "Enter" && value.trim() && onSubmit(value.trim())}
      />
      <Button
        onClick={() => value.trim() && onSubmit(value.trim())}
        style={{ backgroundColor: accentColor }}
        className="text-white hover:opacity-90"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

function StepTextarea({
  label,
  placeholder,
  buttonLabel,
  accentColor,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  buttonLabel: string;
  accentColor: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="bg-muted/50 border-border resize-none"
      />
      <Button
        onClick={() => value.trim() && onSubmit(value.trim())}
        style={{ backgroundColor: accentColor }}
        className="text-white hover:opacity-90"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
