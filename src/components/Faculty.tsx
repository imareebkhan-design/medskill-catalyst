import React from "react";

interface Mentor {
  name: string;
  role: string;
  badges: string[];
  bio: string;
  image?: string;
  initials?: string;
}

const mentors: Mentor[] = [
  {
    name: "Gagan Victor",
    role: "Co-Founder and Program Director",
    badges: ["Former Pfizer, Medtronic, Stryker & BMS"],
    bio: "Former leader at Pfizer, Medtronic India, Stryker, overseeing Cardiovascular and Surgical device portfolio. Transitioned from Medical Rep to Corporate Medtech Leader to full time training, coaching, mentoring to build India’s next generation of Medtech ready professionals.",
    image: "/assets/gagan_victor.png",
  },
  {
    name: "Shilpi Babbar",
    role: "Co-founder and Skills Enhancement Coach",
    badges: ["ICBI-NABET Certified", "Ex-J&J MedTech"],
    bio: "Co-founder and Skills Enhancement coach at Medskills Catalyst, with experience of more than a decade in coaching and career counselling certified by ICBI-NABET. Shilpi specialises in laparoscopy and robotic surgery adoption, guiding candidates through real-world clinical workflows and surgeon communication.",
    image: "/assets/shilpi_babbar.jpg",
  },
  {
    name: "Dr. Vincent Keny, PhD",
    role: "AI Transformational Leader, Executive Coach & Leadership Mentor",
    badges: ["Ex-Boston Scientific", "ICF Certified Coach", "MIT Sloan Alumnus"],
    bio: "With over 25 years of global corporate experience driving business and personal excellence, Dr. Keny brings elite leadership frameworks to MedSkills. An ICF Certified Coach and alumnus of MIT Sloan, he specializes in Spiritual & Emotional Business Intelligence, helping candidates master emotional resilience, interpersonal communication, and high-stakes MedTech corporate dynamics.",
    image: "/assets/vincent_keny.png",
  },
];

export function Faculty() {
  return (
    <section id="faculty" className="bg-canvas text-ink py-20 px-5 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Section Header (Modern Editorial Alignment - Left Aligned) */}
        <header className="mb-16 max-w-3xl text-left">
          <p className="mb-4 inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.15em] text-emerald after:block after:h-px after:w-10 after:bg-emerald">
            The Faculty
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold leading-[1.15] tracking-[-0.02em] text-teal-deep">
            Break into Medtech sales with industry experts.
          </h2>
          <p className="mt-5 text-lg sm:text-[1.15rem] leading-[1.7] font-normal text-ink/70">
            Mentored by Medtech Leaders, No Academics.... Learn directly from leaders who have spent decades building, selling, and hiring at the world's top medtech companies.
          </p>
        </header>

        {/* Mentor Cards (Growth School Aesthetic - Stacked Horizontal strips) */}
        <div className="flex flex-col gap-10">
          {mentors.map((mentor, index) => (
            <div
              key={index}
              className="group relative flex flex-col md:flex-row gap-8 items-center md:items-start p-8 md:p-10 rounded-msc-lg bg-surface border border-teal-pale shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out"
            >
              {/* Left Side: Large Portrait / Initials */}
              <div className="flex-none">
                {mentor.image ? (
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover ring-4 ring-teal-pale/75 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-teal-pale text-teal-deep text-3xl font-display font-bold flex items-center justify-center ring-4 ring-teal-pale/75">
                    {mentor.initials || "MS"}
                  </div>
                )}
              </div>

              {/* Right Side: Details */}
              <div className="flex-grow text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
                  <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-teal-deep">
                    {mentor.name}
                  </h3>
                </div>
                
                <p className="text-sm md:text-base font-semibold text-teal-mid mt-1">
                  {mentor.role}
                </p>

                {/* Trust Badges: crisp pill-shaped tags */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                  {mentor.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1 text-xs font-bold tracking-wide rounded-full bg-teal-pale text-teal-deep border border-teal-mid/10 transition-colors duration-200"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Biography */}
                <p className="mt-5 text-ink/75 text-sm md:text-base leading-relaxed">
                  {mentor.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
