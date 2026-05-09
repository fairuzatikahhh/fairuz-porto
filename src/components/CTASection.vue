<template>
  <div class="py-20 flex flex-col items-center">
    <section class="text-center relative py-16 px-4 md:px-12 rounded-[40px] max-w-4xl mx-auto overflow-hidden w-full" style="background:#2A2A2A;">
      <div class="absolute inset-0 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
      
      <div class="relative z-10 flex flex-col items-center gap-6">
        <h2 class="text-white text-3xl md:text-5xl font-medium leading-tight">
          Got a complex problem?<br/>Let's simplify it together.
        </h2>
        <p class="text-[#8F8F8F] text-lg md:text-xl max-w-xl">
          I'm always open to discussing product design work or partnership opportunities.
        </p>
        <button class="mt-4 px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:scale-105 transition-transform flex items-center gap-2">
          Say Hello <Icon icon="solar:arrow-right-up-linear" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
