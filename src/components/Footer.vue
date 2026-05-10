<template>
  <footer class="py-12 mt-8" style="border-top:1px solid #2A2A2A;">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6 px-4">
      <div class="text-[#8F8F8F] text-sm">
        © 2024 Faiz. All Rights Reserved.
      </div>
      
      <div class="flex gap-4">
        <a v-for="social in socials" :key="social.name" :href="social.link" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-white hover:text-black transition-colors group">
          <img :src="social.icon" :alt="social.name" class="w-5 h-5 group-hover:invert transition-all" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>

const socials = [
  { name: 'linkedin', icon: '/linkedin.svg', link: 'https://www.linkedin.com/in/fairuzatikah/' },
  { name: 'dribbble', icon: '/dribbble.svg', link: 'https://dribbble.com/fairuz_atikah' },
  { name: 'upwork', icon: '/upwork.svg', link: 'https://www.upwork.com/freelancers/~013c299f81c267a6ae' },
  { name: 'instagram', icon: '/instagram.svg', link: 'https://www.instagram.com/ur.dsgnr/' },
]
</script>
