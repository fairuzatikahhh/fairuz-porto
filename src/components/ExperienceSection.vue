<template>
  <section id="journey" class="relative w-full  py-16
   overflow-hidden">
    <div class="max-w-7xl mx-auto w-full">
      
      <!-- HEADER & NAVIGATION ARROWS -->
      <div class="flex justify-between items-center mb-10">
        <h2 class="text-white text-3xl md:text-4xl font-bold">My Journey</h2>
        
        <div class="flex gap-4">
          <!-- Tambahkan event @click untuk memanggil fungsi scroll -->
          <button 
            @click="scrollCarousel('left')"
            class="w-12 h-12 rounded-full bg-[#36272e] hover:bg-pink-500/80 transition-colors flex items-center justify-center text-white"
          >
            <!-- Arrow Left Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
          
          <button 
            @click="scrollCarousel('right')"
            class="w-12 h-12 rounded-full bg-[#36272e] hover:bg-pink-500/80 transition-colors flex items-center justify-center text-white"
          >
            <!-- Arrow Right Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- CAROUSEL CONTAINER -->
      <!-- Tambahkan ref="carouselContainer" agar bisa diakses oleh fungsi JavaScript -->
      <div 
        ref="carouselContainer"
        class="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 scrollbar-hide scroll-smooth"
      >
        
        <!-- CARD ITERATION -->
        <div 
          v-for="(item, index) in journeys" 
          :key="index"
          class="bg-[#1e1e1e] border border-white/5 rounded-[24px] p-6 md:p-8 w-[350px] md:w-[500px] shrink-0 snap-start flex flex-col justify-between min-h-[280px]"
        >
          <!-- Top Section: Logo & Text -->
          <div class="flex flex-col sm:flex-row gap-6 mb-8">
            <div class="w-24 h-24 shrink-0 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center p-4 overflow-hidden">
              <img :src="item.logo" :alt="item.company" class="w-full h-full object-contain" />
            </div>
            
            <div class="flex flex-col">
              <h3 class="text-white text-xl font-semibold mb-3">{{ item.role }}</h3>
              <p class="text-white/60 text-sm leading-relaxed">
                {{ item.desc }}
              </p>
            </div>
          </div>

          <!-- Bottom Section: Company & Year -->
          <div class="flex justify-between items-center text-white mt-auto pt-4 border-t border-white/5">
            <span class="font-medium text-base md:text-lg">{{ item.company }}</span>
            <span class="text-white/80">{{ item.year }}</span>
          </div>
        </div>

      </div>

    </div>
  </section>
</template>

<script setup>
// Meng-import ref dari vue
import { ref } from 'vue'

import logoTries from '../assets/icons.svg'
import logoTercode from '../assets/tercode.svg'
import logoGenah from '../assets/genah.svg'
import logoTelkom from '../assets/telkom.svg'

// Referensi ke elemen div carousel di template
const carouselContainer = ref(null)

// Fungsi untuk menggeser carousel
const scrollCarousel = (direction) => {
  if (carouselContainer.value) {
    // Menentukan jarak geser (misal: selebar satu kartu + gap)
    const scrollAmount = 380; 
    
    if (direction === 'left') {
      carouselContainer.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      carouselContainer.value.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }
}

const journeys = [
  {
    logo: logoTries,
    role: 'UI UX Designer',
    desc: 'Iam Designing and improving interface flows for digital products and also Focused on making user journeys clearer and easier',
    company: 'Tries Digital Indonesia',
    year: '2025 - Now'
  },
  {
    logo: logoTercode,
    role: 'UI UX Designer',
    desc: 'Iam built interface layouts and design systems for web products also Improved consistency across multiple screens',
    company: 'Tercode Indonesia',
    year: '2024 - 2025'
  },
  {
    logo: logoGenah,
    role: 'UI UX Designer',
    desc: 'Iam Designed internal systems (CMS/HRIS) with complex user flows and Simplified structure to reduce user confusion',
    company: 'Genah Indonesia',
    year: '2023 - 2024'
  },
  {
    logo: logoTelkom,
    role: 'UI UX Designer Intern',
    desc: 'Iam Assisted in designing UI components and layouts and I Learned real-world product design workflow and collaborate',
    company: 'Telkom Indonesia',
    year: '2023'
  }
]
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>