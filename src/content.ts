// Konten teks bersama (desktop SlideStory & versi mobile)

export const INTRO = {
  title: 'I design digital experiences that feel clear, useful, and human.',
  body: [
    "Hi, I'm Faiz — a UI/UX Designer who enjoys simplifying complex ideas into clear, usable experiences.",
    'I started by questioning why some apps feel confusing, and that curiosity led me into design. Since then, I\'ve been focusing on improving user flows, especially in dashboards, CMS, and systems with complex structures.',
    "For me, good design isn't just about visuals — it's about helping users move faster, think less, and avoid frustration.",
  ],
};

// Riwayat pekerjaan (urut terbaru; sumber: fairuzatikah.com, "My Journey"). Satu entri = satu titik carousel.
// `look`: 'tries' (lanyard hitam), 'genah' (lanyard biru langit), 'plain' (tanpa lanyard).
export const JOBS = [
  {
    company: 'Tries Digital Indonesia',
    role: 'UI/UX Designer',
    period: '2025 – Now',
    desc: 'I am designing and improving interface flows for digital products, focused on making user journeys clearer and easier.',
    look: 'tries',
  },
  {
    company: 'Tercode Indonesia',
    role: 'UI/UX Designer',
    period: '2024 – 2025',
    desc: 'I built interface layouts and design systems for web products, and improved consistency across multiple screens.',
    look: 'plain', // tanpa lanyard
  },
  {
    company: 'Gawe Becik Nadhah Anugrah',
    role: 'UI/UX Designer',
    period: '2023 – 2024',
    desc: 'I designed internal systems (CMS/HRIS) with complex user flows, and simplified their structure to reduce user confusion.',
    look: 'genah', // lanyard biru langit & kartu putih
  },
  {
    company: 'Telkom Indonesia',
    role: 'UI/UX Designer Intern',
    period: '2023',
    desc: 'I assisted in designing UI components and layouts, and learned real-world product design workflows and collaboration.',
    look: 'plain', // tanpa lanyard
  },
] as const;
