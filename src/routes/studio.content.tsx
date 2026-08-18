import { createFileRoute } from "@tanstack/react-router";
import { SiteContentEditor } from "@/components/studio/Managers";

export const Route = createFileRoute("/studio/content")({
  component: SiteContentEditor,
});
