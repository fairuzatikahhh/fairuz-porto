<script setup>
import DetailProject from '../components/DetailProjectWeb.vue';
import heroMockup from '../assets/nashir/hero_mockup.png';
import heroLogo from '../assets/nashir/logo_nashir.svg'
import overviewImage from '../assets/nashir/overview_nashir.png';
import goalsCenterImage from '../assets/nashir/goals_nashir.svg';
import resultImage from '../assets/nashir/result_nashir.png';

const goals = [
  { icon: 'solar:routing-2-bold', text: 'Simplify stock and product management', pos: { top: '120px', left: '-40px' } },

  { icon: 'solar:mouse-bold', text: 'Support a clearer online shopping experience', pos: { bottom: '120px', left: '-20px' } },

  { icon: 'solar:lightbulb-bold', text: 'Improve stock visibility and control', pos: { top: '160px', right: '-40px' } },

  { icon: 'solar:layers-bold', text: 'Reduce dependency on third-party platforms', pos: { bottom: '80px', right: '-80px' } },
]
const processCards = 
  [
      {
    icon: 'solar:layers-minimalistic-bold',
    title: 'System Structure',
    desc: 'The platform was designed around two connected experiences: a customer-facing storefront for browsing and purchasing products, and an internal CMS for managing products, stock, and operational workflows more efficiently.'
  },
  {
    icon: 'solar:routing-3-bold',
    title: 'Front Store Experience',
    desc: 'The storefront was designed to create a clear and intuitive shopping experience — helping users browse products, understand bundles, and complete purchases more confidently.'
  },
  {
    icon: 'solar:widget-5-bold',
    title: 'CMS Experience',
    desc: 'The CMS was built to support better product and stock control, especially for a bundled items and reducing manual confusion in day-to-day operations.'
  },
     ]

</script>

<template>
    <DetailProject
     :hero-mockup="heroMockup"
     :hero-logo="heroLogo"
     :hero-bg-text="'Nashir'"
     :hero-bg-text-mobile="'text-[10vw]'"
     :hero-bg-text-tablet="'md:text-[260px]'"
     :hero-bg-text-desktop="'lg:text-[350px]'"
     :main-title="'A commerce platform focused on simplifying sales, stock, and operations.'"
     :overview-text="'Nashir is a web commerce platform designed to support both customer shopping and internal stock management in one connected system. The project was built from scratch to address inventory issues, especially around bundled products, while also helping the business reduce dependency on third-party selling platforms.'"
     :overview-image="overviewImage"
     :goals-text="'Defining clear objectives to improve usability, flow, and system structure.'"
     :goals-center-image-size="'w-[90%] md:w-[700px]'"
     :goals="goals"
     :goals-center-image="goalsCenterImage"
     :design-title="'Product Experience'"
     :design-text="'How the product is structured and experienced across both customer and internal systems.'"
     :process-cards="processCards"
     :challenge-text="'This project helped me think beyond storefront design and focus more on how digital commerce should also support business operations behind the scenes. It strengthened my ability to design connected experiences that work for both users and internal workflows.'"
     :result-title="'The Result'"
     :result-text="'The platform delivers a more structured and efficient commerce experience, improving how products and stock are managed while creating a clearer and more reliable shopping flow for customers.'"
     :result-image="resultImage"
    ></DetailProject>

</template>