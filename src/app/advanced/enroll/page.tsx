import type { Metadata } from "next";
import { PublicEnroll } from "@/src/app/enroll/public-enroll";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enroll — Advanced Module | MedSkills Catalyst",
  description:
    "Reserve your seat in the MedSkills Catalyst Advanced Module. Secure enrollment for life-science graduates entering MedTech.",
};

export default function AdvancedEnrollPage() {
  return <PublicEnroll slug="advanced-module" />;
}
