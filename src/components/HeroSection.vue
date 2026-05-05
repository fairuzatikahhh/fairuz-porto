<template>
  <!-- 1. Diperbarui: h-[65vh] untuk mobile (tingginya dipangkas), lg:min-h-screen untuk desktop -->
  <section id="home" class="relative h-[65vh] sm:h-[70vh] lg:min-h-screen flex items-center justify-center overflow-hidden px-6">
    
    <!-- VISUAL CONTAINER -->
    <!-- 2. Diperbarui: justify-end agar elemen merapat ke bawah container -->
    <div class="absolute inset-0 z-0 flex flex-col justify-end items-center pointer-events-none">
      
      <!-- WRAPPER FOTO & NAMA -->
      <!-- 3. Diperbarui: tingginya diset h-[90%] dari 65vh di HP agar padat -->
      <div class="relative flex justify-center items-end h-[90%] sm:h-[95%] lg:h-[90vh] w-full">
        
        <!-- CENTER (IMAGE) -->
        <img 
          :src="profileImg"
          class="relative z-10 h-full w-auto object-contain object-bottom"
          alt="Profile Image"
        />

        <!-- BIG NAME -->
        <img 
          :src="bigname" 
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[95%] sm:w-[85%] md:w-[800px] lg:w-[1200px] opacity-10 z-20 object-contain object-bottom"
          alt="Foreground Name"
        />

      </div>
    </div>

    <!-- WRAPPER KONTEN (Teks Kiri & Kanan) -->
    <div class="relative z-30 grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl items-center gap-12 lg:gap-0 mt-10 lg:mt-0 pointer-events-none lg:pointer-events-auto">
      
      <!-- LEFT -->
      <div class="hidden lg:flex flex-col items-start text-left space-y-5">
        <div class="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full w-fit pointer-events-auto">
          <div class="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-medium text-white/80">Available for Work</span>
        </div>

        <h1 class="text-white text-[36px] font-bold leading-tight">
          Product & UI/UX <br />
          Designer Based in <br />
          Indonesia
        </h1>
      </div>

      <!-- RIGHT -->
      <div class="hidden lg:flex flex-col items-end text-right space-y-6 pr-6 pointer-events-auto">
        <p class="text-white/70 max-w-sm text-[20px] leading-relaxed">
          I blend design thinking with visual storytelling to help brands communicate better.
        </p>

        <button class="flex items-center gap-3 bg-pink-500 hover:bg-pink-600 transition-colors px-6 py-3 rounded-full text-white font-medium shadow-lg shadow-pink-500/20">
          Get to Know Me
        </button>
      </div>

    </div>
  </section>
</template>

<script setup>
import profileImg from '../assets/profile_image.png'
import bigname from '../assets/big_name.svg'
</script>