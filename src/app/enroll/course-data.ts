export type CourseOutline = {
  tagline: string;
  painPoints: { question: string; description: string }[];
  outcomes: { title: string; desc: string }[];
  audience: { title: string; desc: string }[];
  mentors: { name: string; role: string; bio: string; photo: string; tags: string[] }[];
  faqs: { question: string; answer: string }[];
};

export const COURSE_OUTLINES: Record<string, CourseOutline> = {
  "foundation-program": {
    tagline: "The essential playbook for life-science graduates to break into global MedTech brands.",
    painPoints: [
      {
        question: "Is your degree not getting you calls?",
        description: "Life-science degrees often lead to low-paying research roles because colleges don't teach commercial device marketing.",
      },
      {
        question: "Struggling with technical medical jargon?",
        description: "Talking to surgeons and hospital procurement heads feels intimidating without structured training on device dynamics.",
      },
      {
        question: "Unclear about how global MNCs hire?",
        description: "Global brands like Medtronic, Stryker, and Boston Scientific hire based on specific behavioral and commercial competency frameworks.",
      },
      {
        question: "Lacking structured professional mentorship?",
        description: "Navigating your early career decisions alone is slow and risky. You need direct guidance from people who have run these portfolios.",
      },
    ],
    outcomes: [
      {
        title: "Commercial Competency",
        desc: "Master territory management, sales funnel planning, and strategic account acquisition specifically for medical equipment.",
      },
      {
        title: "Clinical Confidence",
        desc: "Learn to communicate effectively with senior doctors, surgeons, and healthcare administrators on technical terms.",
      },
      {
        title: "Recruitment Edge",
        desc: "Complete 1-on-1 resume rebuilding and mock interviews modeled on MNC hiring processes to stand out.",
      },
      {
        title: "Industry Onboarding",
        desc: "Get certified by MedSkills Catalyst and receive 100% placement support to transition into active sales roles.",
      },
    ],
    audience: [
      {
        title: "Life-Science Graduates",
        desc: "B.Sc, B.Pharm, Biotech, and Biomedical graduates looking for corporate business tracks.",
      },
      {
        title: "Aspiring Medical Sales reps",
        desc: "Professionals in general sales or pharma wanting to transition to high-margin medical devices.",
      },
      {
        title: "Healthcare Professionals",
        desc: "Nurses, clinicians, or technical assistants seeking growth in corporate MedTech roles.",
      },
    ],
    mentors: [
      {
        name: "Gagan Victor",
        role: "Programme Director & Lead Mentor",
        bio: "Former Regional Sales Manager at Medtronic India, overseeing cardiovascular and surgical device portfolios across South India. Transitioned from corporate MedTech leadership to build India's next generation of medical device professionals.",
        photo: "/assets/gagan_victor_headshot.png",
        tags: ["Ex-Medtronic", "Sales Strategy", "Interview Prep"],
      },
      {
        name: "Dr. Vincent Keny, PhD",
        role: "Executive Coach & Leadership Mentor",
        bio: "With over 25 years of global corporate experience driving business excellence, Dr. Keny specializes in ICF Coaching and Spiritual & Emotional Business Intelligence, helping candidates master emotional resilience.",
        photo: "/assets/vincent_keny.png",
        tags: ["Ex-Boston Scientific", "ICF Coach", "Leadership Development"],
      },
    ],
    faqs: [
      {
        question: "Is this program completely online?",
        answer: "Yes, the foundation program is fully online with interactive live weekend classes and structured self-paced modules to fit your schedule.",
      },
      {
        question: "Do you offer placement assistance?",
        answer: "Yes, we provide 100% placement support, including resume styling, mock interviews with industry leaders, and direct referrals to top MedTech brands.",
      },
      {
        question: "What happens if I miss a live session?",
        answer: "All live sessions are recorded and uploaded to the student portal within a few hours, accompanied by study guides and assessments.",
      },
      {
        question: "Will I get a certificate?",
        answer: "Yes, upon successfully completing all modules and assessments, you will receive a verified MedSkills Catalyst Certificate of Competency.",
      },
    ],
  },
  "advanced-module": {
    tagline: "High-stakes strategic sales, key account management, and market access for experienced professionals.",
    painPoints: [
      {
        question: "Stuck in middle-tier sales roles?",
        description: "Moving from general sales to key accounts and large-scale hospital bidding requires a complete upgrade of commercial skills.",
      },
      {
        question: "Struggling with multi-stakeholder pricing?",
        description: "Winning government tenders and private hospital chains requires mastering complex margins, distributor setups, and pricing models.",
      },
      {
        question: "Missing structural key account strategies?",
        description: "Selling key equipment isn't about pitching features—it's about understanding hospital P&L and ROI equations for medical directors.",
      },
      {
        question: "Unfamiliar with regulatory market access?",
        description: "Entering new markets, managing clinical trials advocacy, and licensing require specialized regulatory intelligence.",
      },
    ],
    outcomes: [
      {
        title: "Key Account Management",
        desc: "Learn to build multi-year clinical partnerships, manage key opinion leaders (KOLs), and map large enterprise hospitals.",
      },
      {
        title: "P&L and Financial Modelling",
        desc: "Speak the language of CFOs. Present medical device acquisitions in terms of return on investment (ROI), depreciation, and cash flow.",
      },
      {
        title: "Tender & Bid Strategy",
        desc: "Master pricing strategies, regulatory paperwork, and distribution channels for winning corporate and government bids.",
      },
      {
        title: "Leadership Progression",
        desc: "Position yourself for national manager, market access lead, and business head positions within global MNCs.",
      },
    ],
    audience: [
      {
        title: "Experienced MedTech Professionals",
        desc: "Sales executives and product specialists looking to transition into Key Account Management (KAM).",
      },
      {
        title: "Pharma Area Managers",
        desc: "Pharma sales managers transitioning to high-value surgical/diagnostic equipment sales.",
      },
      {
        title: "Corporate Account Managers",
        desc: "Professionals looking to refine executive presence and deal-closure frameworks.",
      },
    ],
    mentors: [
      {
        name: "Gagan Victor",
        role: "Programme Director & Lead Mentor",
        bio: "Former Regional Sales Manager at Medtronic India, overseeing cardiovascular and surgical device portfolios across South India. Transitioned from corporate MedTech leadership to build India's next generation of medical device professionals.",
        photo: "/assets/gagan_victor_headshot.png",
        tags: ["Ex-Medtronic", "Sales Strategy", "Interview Prep"],
      },
      {
        name: "Dr. Vincent Keny, PhD",
        role: "Executive Coach & Leadership Mentor",
        bio: "With over 25 years of global corporate experience driving business excellence, Dr. Keny specializes in ICF Coaching and Spiritual & Emotional Business Intelligence, helping candidates master emotional resilience.",
        photo: "/assets/vincent_keny.png",
        tags: ["Ex-Boston Scientific", "ICF Coach", "Leadership Development"],
      },
    ],
    faqs: [
      {
        question: "How is this different from the Foundation program?",
        answer: "The advanced module focuses on strategic deal-making, key accounts, hospital finance, bidding, and leadership. It is designed for experienced professionals rather than entry-level graduates.",
      },
      {
        question: "Are the case studies based on real deals?",
        answer: "Yes, all key account scenarios, financial models, and case studies are adapted from real-world MedTech deals (e.g., cath-lab installations, robotic systems, corporate tenders).",
      },
      {
        question: "What is the cohort size?",
        answer: "To keep interactive group case discussions effective, the advanced module cohorts are capped at 15 selected professionals.",
      },
      {
        question: "Can I get my employer to sponsor this?",
        answer: "Yes, many MNCs sponsor corporate training. We can provide a detailed syllabus, invoice, and justification letter for your HR department.",
      },
    ],
  },
};

export const DEFAULT_OUTLINE: CourseOutline = {
  tagline: "Build a highly lucrative commercial career in the global medical technology industry.",
  painPoints: [
    {
      question: "Looking to break into MedTech?",
      description: "Entering this highly specialized sector requires structured commercial training and clinical sales credentials.",
    },
    {
      question: "Wanting to scale your growth?",
      description: "MedTech commercial tracks offer some of the fastest progression rates and highest incentives in the healthcare ecosystem.",
    },
  ],
  outcomes: [
    {
      title: "Core Device Marketing",
      desc: "Understand device segments, clinical value positioning, and professional hospital client structures.",
    },
    {
      title: "Fast-Track Career",
      desc: "Get continuous mentor feedback and placement support to transition into global corporate teams.",
    },
  ],
  audience: [
    {
      title: "Science & Business Graduates",
      desc: "Graduates seeking high-growth corporate careers in healthcare and medical technology.",
    },
  ],
  mentors: [
    {
      name: "Gagan Victor",
      role: "Lead Mentor",
      bio: "Ex-Medtronic Sales Leader, directing the MedSkills Catalyst programmes to train future leaders.",
      photo: "/assets/gagan_victor_headshot.png",
      tags: ["Ex-Medtronic", "Sales Strategy"],
    },
  ],
  faqs: [
    {
      question: "How do I secure my seat?",
      answer: "Submit the registration form and complete the program fee to confirm your enrollment in the upcoming cohort.",
    },
  ],
};
