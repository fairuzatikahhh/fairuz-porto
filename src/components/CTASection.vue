<template>
  <div>
    <!-- CTA -->
    <section id="contact" class="py-6">
      <div class="rounded-3xl p-12 text-center flex flex-col items-center gap-6"
        style="background:#E8417B;background:linear-gradient(135deg,#E8417B 0%,#C2305E 100%);">
        <h2 class=" text-white font-normal" style="font-size:clamp(24px,4vw,48px);line-height:1.2;">
          Got a complex problem? Let's simplify it.
        </h2>
        <p class="text-white/80 text-base max-w-lg">
          I'm available for freelance projects and collaborations. Let's create something simple, clear, and impactful.
        </p>
        <button class="flex items-center gap-2 text-[#E8417B] font-semibold text-sm px-6 py-3 rounded-full transition-all hover:scale-105"
          style="background:white;">
          Lets Talk
          <Icon icon="solar:arrow-right-up-bold" class="w-4 h-4" />
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 mt-8" style="border-top:1px solid #2A2A2A;">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Brand -->
        <div class="flex flex-col gap-3">
          <span class=" text-white text-2xl">faiz</span>
          <p class="text-white/40 text-sm leading-relaxed max-w-xs">
            Simplifying complex ideas into clear,usable experiences that help users move faster and think less — without unnecessary complexity in every flow.
          </p>
        </div>

        <!-- My Services -->
        <div class="flex flex-col gap-3">
          <p class="text-white/60 text-sm font-semibold">My Services</p>
          <div class="flex flex-col gap-2">
            <a href="#home" class="text-white/40 text-sm hover:text-white transition-colors">Home</a>
            <a href="#about" class="text-white/40 text-sm hover:text-white transition-colors">About</a>
            <a href="#work" class="text-white/40 text-sm hover:text-white transition-colors">Work</a>
          </div>
        </div>

        <!-- Contact -->
        <div class="flex flex-col gap-3">
          <p class="text-white/60 text-sm font-semibold">Kontak</p>
          <div class="flex flex-col gap-2">
            <p class="text-white/40 text-sm">faira@design.com</p>
            <p class="text-white/40 text-sm">+62 813-8898-1390</p>
          </div>
          <button class="flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-full mt-2 w-fit transition-all hover:opacity-80"
            style="border:1px solid #2A2A2A;background:#1E1E1E;">
            Lets build something meaningful
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mt-0 py-4 px-6" style="background:#E966A0; border-radius: 8px;">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 border border-white rounded-full flex items-center justify-center text-white text-[10px]">C</div>
            <p class="text-white text-sm font-medium">Made with coffee & curiosity</p>
          </div>

        <div class="flex gap-3">
          <a v-for="social in socials" 
            :key="social.name" 
            :href="social.link"
            target="_blank" 
            rel="noopener noreferrer"
            class="w-8 h-8 rounded-full flex items-center justify-center bg-white transition-all hover:scale-110 shadow-sm"
        >
            <img :src="social.icon" :alt="social.name" class="w-5 h-5 object-contain" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>

import { Icon } from '@iconify/vue'

const socials = [
  { name: 'linkedin', icon: 'src/assets/linkedin.svg', link: 'https://www.linkedin.com/in/fairuzatikah/' },
  { name: 'dribbble', icon: 'src/assets/dribbble.svg', link: 'https://dribbble.com/fairuz_atikah' },
  { name: 'upwork', icon: 'src/assets/upwork.svg', link: 'https://www.upwork.com/freelancers/~013c299f81c267a6ae' },
  { name: 'instagram', icon: 'src/assets/instagram.svg', link: 'https://www.instagram.com/ur.dsgnr/' },
]
</script>
