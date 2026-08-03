import type { Metadata } from "next";
import { WebinarNav } from "@/components/webinar/WebinarNav";
import { ThankYou } from "@/components/webinar/ThankYou";
import { MetaTrackOnMount } from "@/src/components/MetaTrack";

export const metadata: Metadata = {
  title: "You're registered — MedSkills Catalyst Masterclass",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <MetaTrackOnMount
        event="Schedule"
        params={{ content_name: "Masterclass registration" }}
      />
      <WebinarNav />
      <ThankYou />
    </>
  );
}
