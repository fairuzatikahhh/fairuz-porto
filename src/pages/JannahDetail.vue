<script setup>
import DetailProject from '../components/DetailProjectMobile.vue';
import heroMockup from '../assets/jannah/hero_mockup.png';
import heroLogo from '../assets/jannah/logo_jannah.svg'
import overviewImage from '../assets/jannah/overview_jannah.svg';
import goalsCenterImage from '../assets/jannah/goals_mockup_jannah.svg';
import resultImage from '../assets/jannah/result_jannah.png';

const goals = 
  [
  { icon: 'solar:routing-2-bold', text: 'Make essential features like prayer tools easy to access and use daily', position: 'md:absolute md:top-[10%] md:left-[5%]' },
  { icon: 'solar:mouse-bold', text: 'Help users understand and follow each stage of the pilgrimage', position: 'md:absolute md:bottom-[20%] md:-left-[2%]' },
  { icon: 'solar:lightbulb-bold', text: 'Enable better coordination through groups, itineraries, and shared information', position: 'md:absolute md:top-[25%] md:-right-[0%]' },
  { icon: 'solar:layers-bold', text: 'Provide clear directions and contextual guidance during the pilgrimage', position: 'md:absolute md:bottom-[10%] md:-right-[5%]' },
     ]
const processCards = 
  [
      {
    icon: 'solar:layers-minimalistic-bold',
    title: 'Understanding the Journet',
    desc: 'I started by mapping out the full Hajj flow, breaking down each stage into smaller, understandable steps. Since the journey involves multiple rituals and sequences, the focus was on identifying key moments where users need guidance the most'
  },
  {
    icon: 'solar:routing-3-bold',
    title: 'Structuring the Experience',
    desc: 'The product was designed around two main contexts: daily worship and Hajj journeys. I defined clear structures for group management, itinerary flow, and material organization to ensure users can easily follow and access what they need at each stage'
  },
  {
    icon: 'solar:widget-5-bold',
    title: 'Designing Guided Interactions',
    desc: 'I focused on creating intuitive and guided interactions — from navigating itineraries to accessing manasik materials and maps — making the experience feel supportive rather than overwhelming'
  },
     ]

</script>

<template>
    <DetailProject
     :hero-mockup="heroMockup"
     :hero-logo="heroLogo"
     :hero-bg-text="'Jannah'"
     :hero-bg-text-mobile="'text-[10vw]'"
     :hero-bg-text-tablet="'md:text-[140px]'"
     :hero-bg-text-desktop="'lg:text-[300px]'"
     :main-title="'Designing a structured digital companion for daily worship and Hajj journeys'"
     :overview-text="'Jannah is a mobile application designed to support Muslims in their daily worship while also helping pilgrims navigate the complexity of Hajj and Umrah. The product combines essential daily features such as prayer tools with a more structured system for Hajj groups — including itinerary management, guided materials, and location-based navigation — to create a more organized and supportive spiritual experience.'"
     :overview-image="overviewImage"
     :goals-text="'Defining clear goals to support both daily worship and structured Hajj experiences'"
     :goals-center-image-size="'w-[180px] md:w-[280px]'"
     :goals="goals"
     :goals-center-image="goalsCenterImage"
     :process-cards="processCards"
     :challenge-text="'Designing for Hajj presented a unique challenge, as the flow involves a series of rituals and sequences that are not commonly experienced firsthand. Without direct personal experience, it required deeper research and careful interpretation to accurately translate the journey into a clear and structured digital experience that users can easily follow.'"
     :result-title="'The Result'"
     :result-description="'A more structured and guided digital experience that supports both daily worship and the Hajj journey, making complex processes easier to understand and follow.'"
     :result-image="resultImage"
    ></DetailProject>

</template>