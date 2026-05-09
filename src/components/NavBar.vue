<template>
  <header class="sticky top-0 z-50 w-full">
    
    <!-- NAVBAR UTAMA -->
    <nav class="flex items-center justify-between w-full py-5 px-6 md:px-12 backdrop-blur-md relative z-20"
         style="background: #1E1E1E;">
      
      <!-- Logo -->
      <span class="text-white text-4xl font-normal tracking-tight">faiz</span>
        
      <!-- Center nav (Desktop) -->
      <div class="hidden md:flex items-center gap-1 p-1.5 rounded-full" style="background:#1E1E1E;border:1px solid #2A2A2A;">
        <a v-for="item in navItems" :key="item.label"
          :href="item.href"
          @click.prevent="scrollTo(item.href)"
          class="flex items-center gap-2 px-8 py-4 rounded-full text-md font-medium transition-all duration-300"
          :class="active === item.id ? 'text-white' : 'text-white/40 hover:text-white/70'"
          :style="active === item.id ? 'background:#E8417B;' : ''"
        >
          <Icon :icon="item.icon" class="w-[24px] h-[24px]" />
          <span v-if="active === item.id">{{ item.label }}</span>
        </a>
      </div>
      
      <!-- Lets Connect (Desktop) - Diubah jadi tag <a> dengan mailto -->
      <a href="mailto:fairuz.design22@gmail.com" class="hidden md:flex items-center gap-2 text-white text-md font-medium px-6 py-4 rounded-full transition-all hover:opacity-80"
        style="border:1px solid #2A2A2A;background:#1E1E1E;">
        Lets Connect
        <Icon icon="solar:arrow-right-up-linear" class="w-[24px] h-[24px]" />
      </a>
    
      <!-- Mobile hamburger -->
      <button @click="mobileOpen = !mobileOpen" class="md:hidden text-white relative z-50">
        <Icon :icon="mobileOpen ? 'solar:close-square-bold' : 'solar:hamburger-menu-bold'" class="w-8 h-8" />
      </button>
    </nav>

    <!-- MOBILE MENU (FLOATING DI BAWAH NAVBAR) -->
    <Transition name="slide">
      <div v-if="mobileOpen" class="absolute top-full left-0 w-full px-6 pt-2 pb-6 md:hidden z-10">
        
        <div class="p-4 flex flex-col gap-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
             style="background:#1E1E1E; border:1px solid #2A2A2A;">
          
          <a v-for="item in navItems" :key="item.label"
            :href="item.href"
            @click.prevent="scrollTo(item.href); mobileOpen = false"
            class="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all"
            :class="active === item.id ? 'text-white' : 'text-white/50'"
            :style="active === item.id ? 'background:#E8417B;' : 'background:transparent;'"
          >
            <Icon :icon="item.icon" class="w-[24px] h-[24px]" />
            {{ item.label }}
          </a>
          
          <!-- Lets Connect Mobile - Diubah jadi tag <a> dengan mailto -->
          <a href="mailto:fairuz.design22@gmail.com" class="flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-2xl mt-1 hover:opacity-80 transition-opacity"
            style="border:1px solid #2A2A2A;">
            Lets Connect <Icon icon="solar:arrow-right-up-linear" class="w-[24px] h-[24px]" />
          </a>

        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const route = useRoute()
const router = useRouter()

// Initialize active state based on current route
const active = ref(route.path.startsWith('/project') ? 'work' : 'home')
const mobileOpen = ref(false)

const navItems = [
  { id: 'home', label: 'Home', href: '#home', icon: 'solar:home-2-linear' },
  { id: 'about', label: 'About', href: '#about', icon: 'solar:user-linear' },
  { id: 'work', label: 'Project', href: '#work', icon: 'solar:bag-3-linear' },
  { id: 'contact', label: 'Contact', href: '#contact', icon: 'solar:phone-linear' },
]

function scrollTo(href) {
  if (route.path !== '/') {
    // If not on home page, navigate to home with hash
    router.push('/' + href)
  } else {
    // If on home page, scroll smoothly
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
}

function onScroll() {
  // Only track scroll sections on home page
  if (route.path !== '/') return

  const sections = ['home', 'about', 'work', 'contact']
  for (const id of sections) {
    const el = document.getElementById(id)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top <= 120 && rect.bottom > 120) {
        active.value = id
        break
      }
    }
  }
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>