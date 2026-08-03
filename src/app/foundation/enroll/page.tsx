import type { Metadata } from "next";
import { PublicEnroll } from "@/src/app/enroll/public-enroll";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enroll — Foundation Program | MedSkills Catalyst",
  description:
    "Reserve your seat in the MedSkills Catalyst Foundation Program. Secure enrollment for life-science graduates entering MedTech.",
};

export default function FoundationEnrollPage() {
  return <PublicEnroll slug="foundation-program" />;
}
