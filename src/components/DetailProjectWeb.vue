<template>
  <div class="min-h-screen" style="background:#1E1E1E;">
    <div class="max-w-[1200px] mx-auto px-5 lg:px-8">
      <NavBar />
      
      <!-- HERO SECTION -->
      <section class="relative pt-12 md:pt-16 pb-8 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[80vh] overflow-hidden">
        <!-- Rankspeed Asia Text Background -->
        <div class="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none">
          <h1 class="text-white font-bold text-[25vw] md:text-[450px] whitespace-nowrap tracking-tighter"
            :class="[heroBgTextMobile, heroBgTextTablet, heroBgTextDesktop]">
            {{heroBgText}}</h1>
        </div>
        <!-- Mockup Image -->
        <div class="relative z-10 w-full max-w-xl md:max-w-3xl mx-auto px-4 mt-6">
          <img :src="heroMockup" alt="Nashir Mockup" class="w-full h-auto max-h-[60vh] md:max-h-[70vh] object-contain mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] rounded-3xl animate-float" />
        </div>
        <!-- Logo Text below -->
        <div class="relative z-10 mt-6 md:mt-8 text-center flex flex-col items-center">
          <img :src="heroLogo" alt="Nashir Logo" class="h-10 md:h-14 w-auto" />
        </div>
      </section>

      <!-- Main Title -->
      <section class="py-24 text-center max-w-4xl mx-auto px-4">
        <h2 class="text-white font-medium text-3xl md:text-[44px] leading-[1.3]">
          {{mainTitle}}
        </h2>
      </section>

      <!-- Overview -->
      <section class="py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
        <div class="flex flex-col gap-6">
          <h3 class="text-white text-3xl md:text-4xl font-normal">Overview</h3>
          <p class="text-white/70 text-base md:text-lg leading-relaxed font-light">
            {{overviewText}}
          </p>
        </div>
        <div class="relative w-full rounded-[24px] shadow-2xl border border-white/5 overflow-hidden">
          <img :src="overviewImage" alt="Overview Mockup" class="w-full h-auto object-cover" />
        </div>
      </section>

      <!-- Goals -->
<section class="pt-16 pb-12 flex flex-col items-center px-4 bg-goals-section bg-cover bg-center bg-no-repeat relative rounded-[24px]">
  <h3 class="text-white text-3xl md:text-[40px] font-normal mb-6">Goals</h3>
  <p class="text-white/60 text-center max-w-2xl text-base md:text-lg mb-4 font-light leading-relaxed">
    {{ goalsText }}
  </p>

  <!-- Mobile -->
  <div class="flex flex-col gap-3 w-full md:hidden px-4">
    <div v-for="(goal, i) in goals" :key="i"
      class="bg-white/5 backdrop-blur-md p-3 pr-5 rounded-[16px] border border-white/10 shadow-2xl flex flex-row items-center gap-3">
      <div class="bg-white/10 shrink-0 w-10 h-10 rounded-[16px] flex items-center justify-center text-white/90 border border-white/5">
        <Icon :icon="goal.icon" class="w-5 h-5" />
      </div>
      <p class="text-white/90 text-[13px] font-light leading-snug">{{ goal.text }}</p>
    </div>
  </div>

  <!-- Desktop -->
  <div class="relative w-full max-w-4xl mx-auto hidden md:block" style="height: 700px;">

    <!-- Circles -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="w-[280px] h-[280px] rounded-full border border-white/5"></div>
      <div class="absolute w-[460px] h-[460px] rounded-full border border-white/10"></div>
      <div class="absolute w-[640px] h-[640px] rounded-full border border-white/5"></div>
    </div>

    <!-- Center Image -->
    <div class="absolute inset-0 flex items-center justify-center z-10">
      <div :class="goalsCenterImageSize">
        <img :src="goalsCenterImage" class="w-full h-auto rounded-[32px] object-cover" />
      </div>
    </div>

    <!-- Goal Cards -->
    <div
      v-for="(goal, i) in goals" :key="i"
      class="absolute bg-white/5 backdrop-blur-md p-4 pr-5 rounded-[24px] border border-white/10 shadow-2xl flex flex-row items-center gap-4 max-w-[280px] z-20 animate-pulse-scale"
      :style="{
        top: goal.pos?.top,
        left: goal.pos?.left,
        right: goal.pos?.right,
        bottom: goal.pos?.bottom,
        animationDelay: i * 0.75 + 's'
      }"
    >
      <div class="bg-white/10 shrink-0 w-12 h-12 rounded-[16px] flex items-center justify-center text-white/90 border border-white/5">
        <Icon :icon="goal.icon" class="w-6 h-6" />
      </div>
      <p class="text-white/90 text-sm font-light leading-snug">{{ goal.text }}</p>
    </div>

  </div>
</section>
      <!-- Design Process -->
      <section class="pt-32 pb-24 flex flex-col items-center px-4 border-t border-[#2A2A2A]">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-6">{{designTitle}}</h3>
        <p class="text-white/60 text-center max-w-2xl text-base md:text-lg mb-16 font-light leading-relaxed">
          {{designText}}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full  mx-auto">
          <div v-for="(card, i) in processCards" :key="i"
            class="bg-[#252525] rounded-[32px] p-10 flex flex-col items-center text-center hover:-translate-y-2 transition-all duration-300 shadow-xl border border-white/5">
            <div class="w-[60px] h-[60px] rounded-full bg-gradient-to-b from-[#E8417B] to-[#C2305E] flex items-center justify-center text-white mb-8 shadow-[0_10px_20px_rgba(232,65,123,0.3)]">
              <Icon :icon="card.icon" class="w-7 h-7" />
            </div>
            <h4 class="text-white font-medium text-lg mb-4" v-html="card.title" />
            <p class="text-white/50 text-[15px] leading-[1.6] font-light">{{ card.desc }}</p>
          </div>
        </div>
      </section>

      <!-- The Challenge -->
      <section class="py-24 flex flex-col items-center text-center px-4 border-t border-[#2A2A2A]">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-8">{{challengeTitle}}</h3>
        <p class="text-white/60 max-w-[900px] text-[17px] md:text-[20px] leading-[1.7] font-light">
          {{ challengeText }}
        </p>
      </section>

      <!-- The Result -->
      <section class="pt-24 pb-0 flex flex-col items-center text-center relative overflow-hidden bg-result-section bg-cover bg-bottom bg-no-repeat rounded-[48px] mb-12">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-6 relative z-10 px-4">{{ resultTitle }}</h3>
        <p class="text-white/60 max-w-[800px] text-[16px] md:text-[18px] leading-[1.7] font-light mb-6 relative z-10 px-8">
          {{ resultText }}
        </p>
        
        <button class="relative z-10 bg-[#E8417B] hover:bg-[#C2305E] text-white font-medium px-8 py-3.5 rounded-full transition-colors duration-300 mb-6 shadow-[0_8px_16px_rgba(232,65,123,0.25)]">
          {{resultButtonLabel}}
        </button>

        <!-- Result Phones Image -->
        <div class="relative w-full z-10 flex justify-center items-end mt-auto">
          <img :src="resultImage" alt="Nashir Result" class="w-[95%] md:w-[90%] max-w-[1100px] h-auto object-contain drop-shadow-2xl align-bottom hover:animate-shake cursor-pointer" />
        </div>
      </section>
      <ProjectsSection title="You may Also Like">

      </ProjectsSection>

      <Footer />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'
import ProjectsSection from './ProjectsSection.vue'

const props = defineProps({
    heroBgText: String,
  heroBgTextMobile: { type: String, default: 'text-[25vw]' },
  heroBgTextTablet: { type: String, default: 'md:text-[300px]' },
  heroBgTextDesktop: { type: String, default: 'lg:text-[450px]' },
  heroMockup: String,
  heroLogo: String,

  // MAIN TITLE
  mainTitle: String,

  // OVERVIEW
  overviewText: String,
  overviewImage: String,

  // GOALS
  goalsText: String,
  goalsCenterImage: String,
  goals: Array, // [{ icon, text }]
   goalsCenterImageSize: { type: String, default: 'w-[90%] md:w-full max-w-[950px]' },

  // DESIGN PROCESS
  designTitle: String,
  designText: String,
  processCards: Array, // [{ icon, title, desc }]

  // CHALLENGE

  challengeTitle: { type: String, default: 'Reflection' },
  challengeText: String,

  // RESULT
  resultTitle: { type: String, default: 'The Result' },
  resultText: String,
  resultButtonLabel: { type: String, default: 'Visit Website' },
  resultImage: String,})

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.bg-result-section {
  background-image: url('../assets/background_result.svg');
}
.bg-goals-section {
  background-image: url('../assets/background_goals.svg');
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes pulse-scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.animate-pulse-scale {
  animation: pulse-scale 3s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-1deg); }
  50% { transform: translateX(4px) rotate(1deg); }
  75% { transform: translateX(-4px) rotate(-1deg); }
}
.hover\:animate-shake:hover {
  animation: shake 0.4s ease-in-out infinite;
}
</style>
