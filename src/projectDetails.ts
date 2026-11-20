// Isi halaman detail project (/project/<slug>). Teks diambil dari website lama (fairuz-porto),
// gambar ada di public/assets/detail/<slug>/. Urutan = urutan kartu di section Project.

export interface ProjectDetail {
  slug: string;
  name: string;
  platform: 'Mobile App' | 'Website' | 'Web Platform';
  mainTitle: string;
  hero: string;            // gambar kecil untuk kartu "Next Project"
  heroFront: string;       // mockup tegak menghadap depan di tengah hero
  prop?: string;           // ilustrasi 3D kecil di bawah mockup; terbang & mendarat di gambar overview
  overview: { text: string; image?: string };
  goals: { text: string; items: string[]; image?: string };
  process: { title: string; text: string; cards: { title: string; desc: string }[] };
  reflection: { title: string; text: string };
  result: { text: string; image?: string };
}

const D = '/assets/detail';

export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: 'buckstore',
    name: 'Buckstore',
    platform: 'Website',
    mainTitle: 'A streetwear e-commerce concept designed to create a bold, clean, and immersive shopping experience.',
    hero: `${D}/buckstore/hero.webp`,
    heroFront: `${D}/buckstore/macbook.webp?v=2`, // MacBook tampak depan (scripts/make-macbook-mockup.cjs)
    overview: {
      text: 'Buckstore is a concept website created for a streetwear fashion brand, designed to explore how bold visual identity and product presentation can come together in a more engaging online shopping experience. The project is currently in the pitching stage and focuses on defining the creative direction and user experience foundation of the brand.',
      image: `${D}/buckstore/macbook-overview.webp?v=1`, // MacBook tampak depan: halaman detail produk
    },
    goals: {
      text: 'Establishing clear goals to shape a brand-led shopping experience.',
      items: [
        'Create a stronger digital identity for the brand',
        'Present products in a more engaging and curated way',
        'Build a clean and intuitive shopping experience',
        'Build trust through clearer product information',
      ],
      image: `${D}/buckstore/goals.webp`,
    },
    process: {
      title: 'Creative Direction',
      text: 'Shaping the visual direction and shopping experience for a modern streetwear concept.',
      cards: [
        { title: 'Visual Direction', desc: 'I shaped the concept’s visual direction and shopping experience through layout, product presentation, and interface styling.' },
        { title: 'Approach', desc: 'The approach focused on defining a strong visual mood, creating a seamless shopping flow, and keeping product presentation at the center of the experience.' },
        { title: 'Concept Direction', desc: 'The goal was to shape a digital experience that feels aligned with streetwear culture — visually bold, product-driven, and easy to explore. Rather than a generic online store, the concept focused on a shopping experience that feels curated, expressive, and brand-led.' },
      ],
    },
    reflection: {
      title: 'Reflection',
      text: 'The interface was designed to keep the products visually dominant while maintaining a clean browsing experience. I focused on balancing bold brand energy with layout clarity, so the overall experience feels stylish without becoming visually overwhelming.',
    },
    result: {
      text: 'A refined concept that defines the brand’s digital direction, with a more engaging product experience and a clear, intuitive shopping flow.',
      image: `${D}/buckstore/result.webp`,
    },
  },
  {
    slug: 'rayspeed',
    name: 'Rayspeed Asia',
    platform: 'Mobile App',
    mainTitle: 'Building a structured international shipping product from scratch.',
    hero: `${D}/rayspeed/hero.webp`,
    heroFront: `${D}/rayspeed/goals.webp`,
    overview: {
      text: 'Rayspeed is a logistics product built to support international package delivery through a more structured and user-friendly digital experience. This project was designed from the ground up, starting from product structure, user flow, and interface direction.',
      image: `${D}/rayspeed/overview.webp`,
    },
    goals: {
      text: 'Defining clear objectives to improve usability, flow, and system structure.',
      items: [
        'Make shipment creation simple and easy to follow',
        'Give customers clear, real-time tracking of every package',
        'Streamline pickup and operational workflows',
        'Build a reliable experience across multiple touchpoints',
      ],
      image: `${D}/rayspeed/hero.webp`,
    },
    process: {
      title: 'Design Process',
      text: 'A structured approach to shaping the product from flow to interface.',
      cards: [
        { title: 'Defining the Product Structure', desc: 'Organizing the core features, information, and navigation into a clear and logical structure to support how the product works as a whole.' },
        { title: 'Creating Intuitive User Flows', desc: 'Designing simple and easy-to-follow flows that help users complete key actions like shipment creation, tracking, and pickup without confusion.' },
        { title: 'Establishing a Scalable UI Foundation', desc: 'Building a consistent interface system that can grow with the product while maintaining clarity, usability, and visual consistency.' },
      ],
    },
    reflection: {
      title: 'The Challenge',
      text: 'Designing a logistics product from scratch meant translating a complex shipping process into something users could understand and navigate with ease. The challenge was to create an experience that felt structured, intuitive, and reliable across multiple touchpoints.',
    },
    result: {
      text: 'The product delivers a clearer and more structured logistics experience, with simplified flows and a scalable UI foundation that improves usability and supports future growth.',
      image: `${D}/rayspeed/result.webp`,
    },
  },
  {
    slug: 'nashir',
    name: 'Nashir',
    platform: 'Web Platform',
    mainTitle: 'A commerce platform focused on simplifying sales, stock, and operations.',
    hero: `${D}/nashir/hero.webp`,
    heroFront: `${D}/nashir/macbook.webp?v=3`, // MacBook tampak depan (scripts/make-macbook-mockup.cjs)
    overview: {
      text: 'Nashir is a web commerce platform designed to support both customer shopping and internal stock management in one connected system. The project was built from scratch to address inventory issues, especially around bundled products, while also helping the business reduce dependency on third-party selling platforms.',
      image: `${D}/nashir/macbook-overview.webp?v=2`, // MacBook tampak depan: halaman daftar produk
    },
    goals: {
      text: 'Defining clear objectives to improve usability, flow, and system structure.',
      items: [
        'Simplify stock and product management',
        'Support a clearer online shopping experience',
        'Improve stock visibility and control',
        'Reduce dependency on third-party platforms',
      ],
      image: `${D}/nashir/goals.webp`,
    },
    process: {
      title: 'Product Experience',
      text: 'How the product is structured and experienced across both customer and internal systems.',
      cards: [
        { title: 'System Structure', desc: 'The platform was designed around two connected experiences: a customer-facing storefront for browsing and purchasing products, and an internal CMS for managing products, stock, and operational workflows more efficiently.' },
        { title: 'Front Store Experience', desc: 'The storefront was designed to create a clear and intuitive shopping experience — helping users browse products, understand bundles, and complete purchases more confidently.' },
        { title: 'CMS Experience', desc: 'The CMS was built to support better product and stock control, especially for bundled items, reducing manual confusion in day-to-day operations.' },
      ],
    },
    reflection: {
      title: 'Reflection',
      text: 'This project helped me think beyond storefront design and focus more on how digital commerce should also support business operations behind the scenes. It strengthened my ability to design connected experiences that work for both users and internal workflows.',
    },
    result: {
      text: 'The platform delivers a more structured and efficient commerce experience, improving how products and stock are managed while creating a clearer and more reliable shopping flow for customers.',
      image: `${D}/nashir/result.webp`,
    },
  },
  {
    slug: 'tries',
    name: 'Company Profile Tries',
    platform: 'Website',
    mainTitle: 'A website redesign built to align Tries’ digital presence with its updated brand identity.',
    hero: `${D}/tries/hero.webp`,
    heroFront: `${D}/tries/macbook.webp?v=1`, // MacBook tampak depan (scripts/make-macbook-mockup.cjs)
    overview: {
      text: 'Tries is a company profile website redesign shaped by a brand transition following its merger into KiriminAja. The project focused on updating the website to better reflect the new visual identity, communication tone, and overall brand direction.',
      image: `${D}/tries/macbook-overview.webp?v=2`, // MacBook tampak depan: halaman Beranda
    },
    goals: {
      text: 'Establishing clear goals to refine the website’s structure, clarity, and alignment with the new brand identity.',
      items: [
        'Reflect the updated identity more consistently',
        'Create a clearer content hierarchy and page flow',
        'Present the company more clearly and professionally',
        'Create a more relevant and polished web experience',
      ],
      image: `${D}/tries/goals.webp`,
    },
    process: {
      title: 'Design Rationale',
      text: 'The reasoning behind the redesign — from brand shift to design decisions.',
      cards: [
        { title: 'Why It Needed a Redesign', desc: 'Tries originally stood as its own brand, but after merging into KiriminAja, its previous website no longer reflected the updated identity. The redesign was needed to align the digital presence with the new brand direction and create a more cohesive representation online.' },
        { title: 'Brand Alignment', desc: 'The redesign was rooted in a shift in identity — from Tries as a standalone brand to Tries under KiriminAja. The website needed to feel more aligned, unified, and representative of the new brand relationship.' },
        { title: 'Design Decision', desc: 'Because the website serves as a brand-facing touchpoint, the redesign needed to feel both visually aligned and easy to understand. I focused on improving hierarchy, simplifying content presentation, and making the experience feel cohesive with the new identity.' },
      ],
    },
    reflection: {
      title: 'Reflection',
      text: 'This project helped me think more critically about how digital interfaces should evolve alongside brand changes. It reinforced the importance of translating identity shifts into experiences that feel clear, intentional, and consistent.',
    },
    result: {
      text: 'The redesigned website delivers a more cohesive and brand-aligned digital presence, with improved structure, clearer content presentation, and a more modern interface that better represents Tries’ new identity after merging into KiriminAja.',
      image: `${D}/tries/result.webp`,
    },
  },
  {
    // DRAF: ditulis dari deskripsi singkat (belum ada di website lama) — perlu ditinjau
    slug: 'clandys',
    name: 'Clandys Virtual Member',
    platform: 'Mobile App',
    mainTitle: 'A virtual membership app that turns everyday store purchases into a rewarding experience.',
    hero: '/assets/projects/clandys.webp',
    heroFront: `${D}/clandys/phone-home.webp?v=1`, // iPhone tampak depan (scripts/make-phone-mockup.cjs)
    overview: {
      image: '/assets/projects/clandys.webp', // tiga layar (login, beranda, transaksi) seperti overview Rayspeed
      text: 'Clandys Virtual Member is a mobile app for Clandys, a retail store, that brings its membership program into the digital space. Customers can shop and complete transactions through the app, follow their orders until pickup, and collect points from every purchase that can later be redeemed for rewards.',
    },
    goals: {
      text: 'Defining clear goals to connect shopping, transactions, and loyalty in one app.',
      items: [
        'Make shopping and ordering from the store easy from a phone',
        'Turn every purchase into points that keep customers coming back',
        'Give customers a clear view of their orders and transaction status',
        'Bring promotions and member benefits directly to customers',
      ],
      image: `${D}/clandys/goals.webp?v=3`, // iPhone miring: layar Detail Redeem
    },
    process: {
      title: 'Design Process',
      text: 'How the member experience was shaped — from store flow to rewards.',
      cards: [
        { title: 'Understanding the Store Flow', desc: 'Mapping how customers shop at the store today — browsing, ordering, paying, and picking up — to find where a digital member experience adds the most value.' },
        { title: 'Designing the Member Journey', desc: 'Structuring the app around a home with points, promos, and categories, a simple product browsing and checkout flow, and transaction tracking with clear statuses.' },
        { title: 'Building a Rewarding Experience', desc: 'Keeping points and rewards front and center with clear calls to action, so members always know what they have earned and how to claim it.' },
      ],
    },
    reflection: {
      title: 'The Challenge',
      text: 'The challenge was balancing two goals in one app: making transactions quick and familiar for everyday shoppers, while keeping the loyalty program visible and motivating — without overwhelming the interface with promotions.',
    },
    result: {
      text: 'A friendly, structured member app where customers can shop, track their orders, and collect points in one place — helping the store build stronger loyalty and bring its membership program online.',
      image: `${D}/clandys/result.webp?v=1`, // dua iPhone miring: Login & Detail Poin (seperti result Rayspeed)
    },
  },
];

export const findProject = (slug: string) => PROJECT_DETAILS.find((p) => p.slug === slug);
// slug dari path /project/<slug>; null kalau bukan halaman detail
export function detailSlugFromPath(path = window.location.pathname): string | null {
  const m = path.match(/^\/project\/([\w-]+)\/?$/);
  return m && findProject(m[1]) ? m[1] : null;
}
