<script setup>
import DetailProject from '../components/DetailProjectWeb.vue';
import heroMockup from '../assets/buckstore/hero_buckstore.png';
import heroLogo from '../assets/buckstore/logo_buckstore.svg'
import overviewImage from '../assets/buckstore/overview_buckstore.png';
import goalsCenterImage from '../assets/buckstore/goals_buckstore.svg';
import resultImage from '../assets/buckstore/result_buckstore.png';

const goals = 
  [
    { icon: 'solar:routing-2-bold', text: 'Create a stronger digital identity for the brand', pos: { top: '120px', left: '-40px' }},
  { icon: 'solar:mouse-bold', text: 'Present products in a more engaging and curated way', pos: { bottom: '120px', left: '-20px' } },
  { icon: 'solar:lightbulb-bold', text: 'Build a clean and intuitive shopping experience', pos: { top: '160px', right: '-40px' } },
  { icon: 'solar:layers-bold', text: 'Build trust through clearer product information', pos: { bottom: '80px', right: '-80px' } },
     ]
const processCards = 
  [
      {
    icon: 'solar:layers-minimalistic-bold',
    title: 'Visual Direct',
    desc: 'I shaped the concept’s visual direction and shopping experience through layout, product presentation, and interface styling.'
  },
  {
    icon: 'solar:routing-3-bold',
    title: 'Approach',
    desc: 'The approach focused on defining a strong visual mood, creating a seamless shopping flow, and keeping product presentation at the center of the experience.'
  },
  {
    icon: 'solar:widget-5-bold',
    title: 'Concept Direction',
    desc: 'The goal was to shape a digital experience that feels aligned with streetwear culture — visually bold, product-driven, and easy to explore. Rather than creating a generic online store, the concept focused on building a shopping experience that feels curated, expressive, and brand-led.'
  },
     ]

</script>

<template>
    <DetailProject
     :hero-mockup="heroMockup"
     :hero-logo="heroLogo"
     :hero-bg-text="'Buckstore'"
     :hero-bg-text-mobile="'text-[10vw]'"
     :hero-bg-text-tablet="'md:text-[140px]'"
     :hero-bg-text-desktop="'lg:text-[232px]'"
     :main-title="'A streetwear e-commerce concept designed to create a bold, clean, and immersive shopping experience.'"
     :overview-text="'Buckstore is a concept website created for a streetwear fashion brand, designed to explore how bold visual identity and product presentation can come together in a more engaging online shopping experience. The project is currently in the pitching stage and focuses on defining the creative direction and user experience foundation of the brand.'"
     :overview-image="overviewImage"
     :goals-text="'Establishing clear goals to refine the website’s structure, clarity, and alignment with the new brand identity.'"
     :goals-center-image-size="'w-[90%] md:w-[700px]'"
     :goals="goals"
     :goals-center-image="goalsCenterImage"
     :design-title="'Creative Direction'"
     :design-text="'Shaping the visual direction and shopping experience for a modern streetwear concept.'"
     :process-cards="processCards"
     :challenge-text="'The interface was designed to keep the products visually dominant while maintaining a clean browsing experience. I focused on balancing bold brand energy with layout clarity, so the overall experience feels stylish without becoming visually overwhelming.'"
     :result-title="'The Result'"
     :result-text="'A refined concept that defines the brand’s digital direction, with a more engaging product experience and a clear, intuitive shopping flow.'"
     :result-image="resultImage"
    ></DetailProject>

</template>