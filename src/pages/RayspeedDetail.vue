<script setup>
import DetailProject from '../components/DetailProjectMobile.vue';
import heroMockup from '../assets/hero_rayspeed.png';
import heroLogo from '../assets/logo_rayspeed.svg'
import overviewImage from '../assets/reyspeed.svg';
import goalsCenterImage from '../assets/goals_mockup_rayspeed.svg';
import resultImage from '../assets/result_rayspeed.png';

const goals = 
  [
      { icon: 'solar:routing-2-bold', text: 'Simplify stock and product management', position: 'md:absolute md:top-[10%] md:left-[5%]' },
  { icon: 'solar:mouse-bold', text: 'Support a clearer online shopping experience', position: 'md:absolute md:bottom-[20%] md:-left-[2%]' },
  { icon: 'solar:lightbulb-bold', text: 'Improve stock visibility and control', position: 'md:absolute md:top-[25%] md:-right-[0%]' },
  { icon: 'solar:layers-bold', text: 'Reduce dependency on third-party platforms', position: 'md:absolute md:bottom-[10%] md:-right-[5%]' },
     ]
const processCards = 
  [
      {
    icon: 'solar:layers-minimalistic-bold',
    title: 'Defining the Product<br/>Structure',
    desc: 'I Organizing the core features, information, and navigation into a clear and logical structure to support how the product works as a whole.'
  },
  {
    icon: 'solar:routing-3-bold',
    title: 'Create intuitive user flows',
    desc: 'Designing simple and easy-to-follow flows that help users complete key actions like shipment creation, tracking, and pickup without confusion.'
  },
  {
    icon: 'solar:widget-5-bold',
    title: 'Establish a scalable UI<br/>foundation',
    desc: 'Building a consistent interface system that can grow with the product while maintaining clarity, usability, and visual consistency.'
  },
     ]

</script>

<template>
    <DetailProject
     :hero-mockup="heroMockup"
     :hero-logo="heroLogo"
     :hero-bg-text="'Rayspeed Asia'"
     :hero-bg-text-mobile="'text-[10vw]'"
     :hero-bg-text-tablet="'md:text-[140px]'"
     :hero-bg-text-desktop="'lg:text-[160px]'"
     :main-title="'Building a structured international shipping product from scratch'"
     :overview-text="'Rayspeed is a logistics product built to support international package delivery through a more structured and user-friendly digital experience. This project was designed from the ground up, starting from product structure, user flow, and interface direction.'"
     :overview-image="overviewImage"
     :goals-text="'Defining clear objectives to improve usability, flow, and system structure.'"
     :goals-center-image-size="'w-[180px] md:w-[280px]'"
     :goals="goals"
     :goals-center-image="goalsCenterImage"
     :process-cards="processCards"
     :challenge-text="'Designing a logistics product from scratch meant translating a complex shipping process into something users could understand and navigate with ease. The challenge was to create an experience that felt structured, intuitive, and reliable across multiple touchpoints.'"
     :result-title="'The Result'"
     :result-text="'The product delivers a clearer and more structured logistics experience, with simplified flows and a scalable UI foundation that improves usability and supports future growth.'"
     :result-image="resultImage"
    ></DetailProject>

</template>