export interface JobTimelineItem {
  phase: string;
  label: string;
  date: string;
}

export interface JobFAQItem {
  question: string;
  answer: string;
}

export interface JobOpening {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  duration: string;
  deadline: string;
  status: 'Open' | 'Closed';
  heroImage: string;
  tagline: string;
  subtitle: string;
  about: string;
  responsibilities: string[];
  eligibility: string[];
  benefits: string[];
  timeline: JobTimelineItem[];
  faqs: JobFAQItem[];
}

export const JOB_OPENINGS: JobOpening[] = [
  {
    slug: 'campus-ambassador',
    title: 'Campus Ambassador (Batch 2)',
    department: 'Community & Growth',
    location: 'Remote (Your College)',
    type: 'Part-Time / Student Internship',
    duration: '3 Months',
    deadline: 'July 31, 2026',
    status: 'Open',
    heroImage: '/assets/campus_ambassador_hero.png',
    tagline: 'Become a MedSkills Catalyst Campus Ambassador (Batch 2)',
    subtitle: 'Be the voice of MedTech on your campus. Connect peers to career opportunities, organize workshops, and get direct mentorship from industry leaders.',
    about: 'Many students in life sciences, biotechnology, and pharmacy graduate without knowing that a high-growth career in MedTech sales, regulatory affairs, or application engineering is even possible. As a Campus Ambassador, you\'ll bridge that gap. You will lead the student community at your college, introduce them to industry insights, and help them take their first step into the MedTech ecosystem. In return, you\'ll work directly with our founding team, receive practical skill training, and get mentored by senior leaders from top healthcare brands.',
    responsibilities: [
      'Represent MedSkills Catalyst as the main point of contact at your college.',
      'Build and nurture a local WhatsApp community of Life Sciences, Biotech, and Pharmacy peers.',
      'Help run online workshops and coordinate offline MedTech awareness drives on campus.',
      'Spread the word about our webinars, masterclasses, and free training resources.',
      'Collect feedback from classmates on what career support and courses they need most.',
      'Work closely with our growth team to design and test new campus campaigns.'
    ],
    eligibility: [
      'Currently enrolled in a UG (Undergraduate) or PG (Postgraduate) science program.',
      'Studying Life Sciences, Biotechnology, Biomedical, Pharmacy, Healthcare, Microbiology, Biochemistry, or related fields.',
      'You\'re someone who loves initiating conversations and doesn\'t mind public speaking or community hosting.',
      'Active participation in college clubs, student placement cells, or volunteer work is highly preferred.'
    ],
    benefits: [
      'Performance-Based Stipend: Earn regular payouts and bonuses linked to event registrations and community growth milestones.',
      'Official Leadership Certificate: Get an official certificate recognizing your role as a student ambassador.',
      'Founders\' Recommendation (LOR): Top-performing ambassadors receive a personalized LOR directly from our Co-Founders.',
      'Free Premium Workshops: Join exclusive training sessions on business writing, networking, and public speaking.',
      'Direct Industry Mentorship: Get regular career reviews and resume advice from professionals who have worked at global brands.',
      'Priority Team Hiring: Ambassadors get fast-tracked for future internal internships and full-time roles.'
    ],
    timeline: [
      { phase: '1', label: 'Applications Open', date: 'July 13, 2026' },
      { phase: '2', label: 'Applications Close', date: 'July 31, 2026' },
      { phase: '3', label: 'Review & Shortlisting', date: 'August 1 - 3, 2026' },
      { phase: '4', label: 'Virtual Conversations', date: 'August 4 - 6, 2026' },
      { phase: '5', label: 'Onboarding & Tool Setup', date: 'August 7, 2026' },
      { phase: '6', label: 'Interactive Training Bootcamp', date: 'August 8 - 9, 2026' },
      { phase: '7', label: 'Program Starts', date: 'August 10, 2026' }
    ],
    faqs: [
      {
        question: 'How many hours do I need to put in?',
        answer: 'About 4-6 hours a week. It\'s flexible and self-paced, so you can easily fit it around your regular classes, labs, and exams.'
      },
      {
        question: 'Is this role paid?',
        answer: 'Yes. It\'s performance-based, meaning you earn clear stipends and bonuses as you hit simple, pre-defined milestones for your campus.'
      },
      {
        question: 'Will I have to travel?',
        answer: 'No. All training, meetings, and syncs are completely remote. Any promotions or coordination will happen directly on your own campus.'
      },
      {
        question: 'What do I need to do to get a Recommendation Letter (LOR)?',
        answer: 'We value consistency. Top-performing ambassadors who actively complete their weekly tasks and show enthusiasm for building their campus communities will receive a personalized LOR from our Co-Founders.'
      },
      {
        question: 'I\'m in my second year. Can I still apply?',
        answer: 'Yes! While final-year students find it highly relevant, pre-final and second-year students who are active in student clubs, placement cells, or community hosting are very welcome to apply.'
      },
      {
        question: 'What happens after I submit my application?',
        answer: 'We review every single form. If your application matches what we\'re looking for, we\'ll reach out via WhatsApp and email to schedule a quick 10-15 minute chat to get to know you better.'
      }
    ]
  }
];
