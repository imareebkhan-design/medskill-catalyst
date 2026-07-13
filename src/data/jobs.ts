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
    tagline: 'Become a MedSkills Catalyst Campus Ambassador',
    subtitle: 'Lead your campus. Inspire students. Build your leadership skills. Get mentored by industry professionals. Help shape the future of MedTech education.',
    about: 'MedSkills Catalyst\'s Campus Ambassador Program (Batch 2) is an elite student leadership initiative designed to connect university campuses across India with the rapidly growing Medical Technology (MedTech) ecosystem. As a Campus Ambassador, you will serve as the primary liaison between MedSkills Catalyst and your institution. You will lead local student communities, conduct awareness campaigns, and help bridge the gap between academic degrees and career opportunities in device sales, regulatory affairs, clinical research, and application engineering. This is a hands-on learning opportunity to build invaluable business skills while being mentored by senior leaders from global healthcare brands.',
    responsibilities: [
      'Represent MedSkills Catalyst as the official student face and advocate on your campus.',
      'Build and nurture an active community of Life Sciences, Biotech, and Pharmacy students.',
      'Conduct digital and offline awareness campaigns about career paths in the MedTech industry.',
      'Organize and host virtual workshops, information sessions, and campus events.',
      'Promote MedSkills Catalyst webinars and masterclasses, driving student registrations.',
      'Collect valuable feedback from students regarding their career aspirations and learning needs.',
      'Collaborate with our core marketing and growth teams to brainstorm campaign ideas.',
      'Represent student feedback to help shape curriculum offerings and student benefits.'
    ],
    eligibility: [
      'Currently enrolled in a UG (Undergraduate) or PG (Postgraduate) program.',
      'Final-year or pre-final-year students are preferred.',
      'Background in Life Sciences, Biotechnology, Biomedical, Pharmacy, Healthcare, Bioengineering, Microbiology, Biochemistry, or related disciplines.',
      'Strong communication, public speaking, or social media presence.',
      'Previous experience in college clubs, student councils, volunteer work, or event management is a major plus.'
    ],
    benefits: [
      'Performance-Based Stipend: Earn competitive stipends, cash milestones, and bonuses based on your campus campaigns.',
      'Completion Certificate: Receive an official certificate recognizing your leadership and marketing contributions.',
      'Letter of Recommendation (LOR): Deserving candidates receive a personalized LOR from our Co-Founders for their future job applications.',
      'Exclusive Workshops: Free access to premium business communication, networking, and MedTech-specific training sessions.',
      'Industry Mentorship: Direct feedback and guidance sessions with professionals who have worked at global MedTech brands.',
      'Professional Networking: Connect with a country-wide network of ambitious student ambassadors and industry leaders.',
      'Priority Hiring: Gain top-priority consideration for future internships, projects, or full-time roles at MedSkills Catalyst.'
    ],
    timeline: [
      { phase: '1', label: 'Applications Open', date: 'July 13, 2026' },
      { phase: '2', label: 'Applications Close', date: 'July 31, 2026' },
      { phase: '3', label: 'Shortlisting & Reviews', date: 'August 1 - 3, 2026' },
      { phase: '4', label: 'Virtual Interviews', date: 'August 4 - 6, 2026' },
      { phase: '5', label: 'Onboarding & Setup', date: 'August 7, 2026' },
      { phase: '6', label: 'Training Boot Camp', date: 'August 8 - 9, 2026' },
      { phase: '7', label: 'Program Commences', date: 'August 10, 2026' }
    ],
    faqs: [
      {
        question: 'What is the time commitment required?',
        answer: 'You should expect to spend around 4-6 hours per week on ambassador activities. Since the schedule is flexible and self-paced, you can easily complete it alongside your daily college lectures and exams.'
      },
      {
        question: 'Is this a paid role?',
        answer: 'Yes, this is a paid internship opportunity. It offers a performance-based stipend model where you earn financial rewards based on successful campaign execution, event registrations, and community growth milestones.'
      },
      {
        question: 'Is the program completely remote?',
        answer: 'Yes, all communication, training, and strategic reporting are fully remote. However, you will be conducting offline engagement activities (such as sharing flyers, talking to peers, or coordinating with college clubs) directly inside your college campus.'
      },
      {
        question: 'What are the criteria for receiving a Letter of Recommendation?',
        answer: 'Ambassadors who actively participate, complete their weekly goals, and achieve their cohort targets will receive a strong Letter of Recommendation signed by our founders, which can help significantly in corporate job applications.'
      },
      {
        question: 'I am in my second year of college. Can I still apply?',
        answer: 'Yes, absolutely! While final-year students are preferred because they are closer to entering the industry, we strongly welcome applications from second-year or pre-final-year students who demonstrate high energy, initiative, and active involvement in college activities.'
      },
      {
        question: 'What happens after I submit the form?',
        answer: 'Our recruitment team reviews submissions on a rolling basis. If your profile matches, we will contact you via WhatsApp and email to schedule a short 10-15 minute video call to discuss your interest and communication skills.'
      }
    ]
  }
];
