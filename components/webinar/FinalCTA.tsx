import { WEBINAR } from "@/lib/webinar.config";
import { TrackedCTA } from "./ui/TrackedCTA";

export function FinalCTA() {
  return (
    <section className="bg-teal-deep px-5 py-20 text-center text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display font-bold leading-[1.1] tracking-[-0.02em] [font-size:clamp(1.8rem,3.8vw,2.8rem)]">
          The MedTech hiring window is open. Don&apos;t watch from the sidelines.
        </h2>
        <p className="mt-4 text-lg text-white/75">
          {WEBINAR.dateLabel} · {WEBINAR.timeLabel} · {WEBINAR.platformLabel} ·{" "}
          {WEBINAR.price}
        </p>
        <div className="mt-8 flex justify-center">
          <TrackedCTA label="Reserve my free seat" location="final_cta">
            Reserve my free seat →
          </TrackedCTA>
        </div>
        <p className="mt-4 text-sm text-white/55">
          Zoom link sent to your WhatsApp &amp; email after you register.
        </p>
      </div>
    </section>
  );
}
