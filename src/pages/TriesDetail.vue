<script setup>
import DetailProject from '../components/DetailProjectWeb.vue';
import heroMockup from '../assets/tries/hero_mockup.png';
import heroLogo from '../assets/tries/logo_tries.svg'
import overviewImage from '../assets/tries/overview_tries.png';
import goalsCenterImage from '../assets/tries/goals_tries.svg';
import resultImage from '../assets/tries/result_tries.png';

const goals = [
  { icon: 'solar:routing-2-bold', text: 'Reflect the updated identity more consistently', pos: { top: '120px', left: '-40px' } },

  { icon: 'solar:mouse-bold', text: 'Create a clearer content hierarchy and page flow', pos: { bottom: '120px', left: '-20px' } },

  { icon: 'solar:lightbulb-bold', text: 'Present the company more clearly and professionally', pos: { top: '160px', right: '-40px' } },

  { icon: 'solar:layers-bold', text: 'Create a more relevant and polished web experience', pos: { bottom: '80px', right: '-80px' } },
]
const processCards = 
  [
      {
    icon: 'solar:layers-minimalistic-bold',
    title: 'Why It Needed Redesign?',
    desc: 'Tries originally stood as its own brand, but after merging into KiriminAja, its previous website no longer reflected the updated identity. The redesign was needed to align the digital presence with the new brand direction and create a more cohesive representation online.'
  },
  {
    icon: 'solar:routing-3-bold',
    title: 'Brand Alignment',
    desc: 'The redesign was rooted in a shift in identity — from Tries as a standalone brand to Tries under KiriminAja. This meant the website needed to feel more aligned, unified, and representative of the new brand relationship.'
  },
  {
    icon: 'solar:widget-5-bold',
    title: 'Design Decision',
    desc: 'Because the website serves as a brand-facing touchpoint, the redesign needed to feel both visually aligned and easy to understand. I focused on improving hierarchy, simplifying content presentation, and making the overall experience feel more cohesive with the new identity.'
  },
     ]

</script>

<template>
    <DetailProject
     :hero-mockup="heroMockup"
     :hero-logo="heroLogo"
     :hero-bg-text="'Tries'"
     :hero-bg-text-mobile="'text-[10vw]'"
     :hero-bg-text-tablet="'md:text-[260px]'"
     :hero-bg-text-desktop="'lg:text-[500px]'"
     :main-title="'A website redesign built to align Tries’ digital presence with its updated brand identity.'"
     :overview-text="'Tries is a company profile website redesign shaped by a brand transition following its merger into KiriminAja. The project focused on updating the website to better reflect the new visual identity, communication tone, and overall brand direction'"
     :overview-image="overviewImage"
     :goals-text="'Establishing clear goals to refine the website’s structure, clarity, and alignment with the new brand identity.'"
     :goals-center-image-size="'w-[90%] md:w-[700px]'"
     :goals="goals"
     :goals-center-image="goalsCenterImage"
     :design-title="'Design Rationale'"
     :design-text="'The reasoning behind the redesign — from brand shift to design decisions.'"
     :process-cards="processCards"
     :challenge-text="'This project helped me think more critically about how digital interfaces should evolve alongside brand changes. It reinforced the importance of translating identity shifts into experiences that feel clear, intentional, and consistent.'"
     :result-title="'The Result'"
     :result-text="'The redesigned website delivers a more cohesive and brand-aligned digital presence, with improved structure, clearer content presentation, and a more modern interface that better represents Tries’ new identity after merging into KiriminAja.'"
     :result-image="resultImage"
    ></DetailProject>

</template>