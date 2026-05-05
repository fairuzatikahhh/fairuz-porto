<template>
  <section class="pb-16">
<div class="grid gap-4" style="grid-template-columns: 1fr 1fr 2fr;">
  <!-- What I Value -->
  <div class="card p-6 flex flex-col gap-4 rounded-3xl">
    <p class="text-white/40 text-xs uppercase tracking-widest">What I Value</p>
    <p class="text-white/80 text-xl leading-relaxed">
      I design for clarity, trust, and real user behavior.
    </p>

      <div class="mt-auto flex justify-end pt-4">
        <div class="w-32 h-32 rounded-2xl flex items-center justify-center" style="background:#E8417B22;border:1px solid #E8417B44;">
          <Icon icon="solar:shield-check-bold" class="w-32 h-32 text-[#E8417B]" />
        </div>
      </div>

  </div>
  
  <!-- What My Tools -->
  <div class="card p-8 flex flex-col min-h-[300px] rounded-3xl bg-[#1A1A1A] overflow-hidden relative">
  <div class="flex flex-col gap-2 mb-12">
    <p class="text-white/40 text-xs uppercase tracking-widest">What My Tools</p>
    <p class="text-white text-xl font-medium leading-relaxed max-w-[250px]">
      The tools I use to shape ideas into polished interfaces.
    </p>
  </div>

  <div class="relative h-32 mt-auto flex justify-center items-end pb-8">
    <div 
      v-for="(tool, index) in tools" 
      :key="tool.name"
      class="absolute w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 hover:z-50 hover:scale-125 border border-white/10 shadow-2xl"
      :style="{
        background: '#121212',
        /* Hitung posisi horizontal, rotasi, dan elevasi (Y) */
        transform: `translateX(${(index - (tools.length - 1) / 2) * 45}px) 
                    rotate(${(index - (tools.length - 1) / 2) * 10}deg) 
                    translateY(${Math.abs(index - (tools.length - 1) / 2) * 10}px)`,
        zIndex: 10 - Math.abs(index - Math.floor(tools.length / 2)),
        // Ikon tengah dibuat lebih terang/fokus
        opacity: index === Math.floor(tools.length / 2) ? 1 : 0.6
      }"
    >
      <img :src="tool.img" :alt="tool.name" class="w-8 h-8 object-contain" />
    </div>
  </div>
</div>

<!-- How I Work -->
 <div class="card p-8 flex flex-col gap-6 rounded-3xl bg-[#1A1A1A] min-h-[400px] relative">
  
  <div class="self-start px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
    <p class="text-white/80 text-xs font-medium uppercase">How I Work</p>
  </div>

  <div v-if="currentStep" class="flex flex-col gap-4">
    <h2 class="text-white text-4xl font-bold">
      <span class="">{{ currentStep.number }}</span> {{ currentStep.title }}
    </h2>
    <p class="text-white/70 text-lg leading-relaxed">
      {{ currentStep.description }}
    </p>
  </div>
    
  <div class="mt-auto bg-white/5 border border-white/10 p-2 rounded-[40px] flex justify-between items-center">
    <button 
      v-for="step in processSteps" 
      :key="step.id"
      @click="activeStep = step.id"
      :class="[
        'flex items-center gap-3 transition-all duration-300',
        activeStep === step.id ? 'bg-[#E8417B] text-white px-6 py-4 rounded-[32px]' : 'text-white/40 px-5 py-4'
      ]"
    >
      <Icon :icon="step.icon" class="w-6 h-6" />
      <span v-if="activeStep === step.id" class="font-semibold">{{ step.label }}</span>
    </button>
  </div>
  </div>
  </div>
  </section>
</template>

<script setup>
// import { ref } from 'vue'
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue'
import figmaImg from '../assets/devicon_figma.svg'
import framerImg from '../assets/gg_framer.svg'
import blenderImg from '../assets/devicon_blender.svg'
import lottieImg from '../assets/material-icon-theme_lottie.svg'
import mazeImg from '../assets/gg_maze.svg'

const tools = [
  { name: 'Blender', img:  blenderImg},
  { name: 'Lottie', img: lottieImg  },
  { name: 'Figma', img: figmaImg  },
  { name: 'Framer', img:  framerImg },
  { name: 'Maze', img: mazeImg },
]

// Taruh di bawah data tools (Baris 96 ke bawah)
const activeStep = ref('research');

const processSteps = [
  {
    id: 'research',
    number: '01',
    label: 'Research',
    title: 'Research',
    icon: 'solar:magnifer-bold',
    description: 'I begin by understanding the problem through quick research — analyzing competitors, user flows, and existing patterns'
  },
  {
    id: 'design',
    number: '02',
    label: 'User Interface',
    title: 'User Interface',
    icon: 'solar:monitor-smartphone-bold',
    description: 'I craft detailed interfaces—refining layout, spacing, and hierarchy—while ensuring consistency and scalability through design systems'
  },
  {
    id: 'prototype',
    number: '03',
    label: 'Prototype',
    title: 'Prototype',
    icon: 'solar:routing-bold',
    description: 'I bring designs to life with interactive prototypes—testing flows early to refine details and ensure a smooth experience'
  },
  {
    id: 'handoff',
    number: '04',
    label: 'Hand Off',
    title: 'Hand Off',
    icon: 'solar:hand-stars-bold',
    description: 'I bridge design and development—providing clear specs, reusable components, and responsive guidelines for accurate implementation'
  },
 
  
];

const currentStep = computed(() => {
  return processSteps.find(step => step.id === activeStep.value);
});

// const activeStep = ref('research')
// const processSteps = [
//   { id: 'research', label: 'Research', icon: 'solar:magnifer-bold' },
//   { id: 'ui', label: 'UI', icon: 'solar:pen-2-bold' },
//   { id: 'prototype', label: 'Prototype', icon: 'solar:repeat-bold' },
//   { id: 'handoff', label: 'Handoff', icon: 'solar:hand-stars-bold' },
// ]
</script>
