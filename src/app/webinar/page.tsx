import type { Metadata } from "next";
import { AnalyticsBoot } from "@/components/webinar/AnalyticsBoot";
import { WebinarNav } from "@/components/webinar/WebinarNav";
import { Hero } from "@/components/webinar/Hero";
import { Benefits } from "@/components/webinar/Benefits";
import { WhatYoullLearn } from "@/components/webinar/WhatYoullLearn";
import { FreeResources } from "@/components/webinar/FreeResources";
import { Speakers } from "@/components/webinar/Speakers";
import { WhoThisIsFor } from "@/components/webinar/WhoThisIsFor";
import { FAQ } from "@/components/webinar/FAQ";
import { RegistrationForm } from "@/components/webinar/RegistrationForm";
import { FinalCTA } from "@/components/webinar/FinalCTA";
import { WEBINAR } from "@/lib/webinar.config";
import { MetaTrackOnMount } from "@/src/components/MetaTrack";

export const metadata: Metadata = {
  title: `${WEBINAR.title} — Free MedSkills Catalyst Masterclass`,
  description: WEBINAR.subtitle,
  openGraph: {
    title: `${WEBINAR.title} — Free Live Masterclass`,
    description: WEBINAR.subtitle,
    type: "website",
  },
};

import { HiringPartners } from "@/components/webinar/HiringPartners";

export default function WebinarLandingPage() {
  return (
    <>
      <MetaTrackOnMount
        event="ViewContent"
        params={{ content_name: "Webinar landing" }}
      />
      <WebinarNav />
      <main className="font-body">
      <AnalyticsBoot />
      <Hero />
      <Benefits />
      <HiringPartners />
      <WhatYoullLearn />
      <FreeResources />
      <Speakers />
      <WhoThisIsFor />
      <FAQ />
      <RegistrationForm />
      <FinalCTA />
    </main>
    </>
  );
}
