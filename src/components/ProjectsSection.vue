<template>
  <section id="work" class="py-16 overflow-hidden" style="border-top:1px solid #2A2A2A;">
    
    <!-- Header -->
    <div class="text-center mb-12 px-6">
      <h2 class="text-white font-normal" style="font-size:clamp(28px,4vw,52px);line-height:1.2;">
        Thoughtfully crafted interfaces built for<br class="hidden sm:block" />
        real users and real workflows.
      </h2>
    </div>

    <!-- Filter tabs: Hapus ukuran fixed w-[171px] h-[56px], ganti ke padding yang responsif -->
    <div class="flex gap-3 flex-wrap justify-center mb-8 px-6">
      <button v-for="tab in tabs" :key="tab"
        @click="activeTab = tab"
        class="px-6 py-2.5 rounded-full text-sm md:text-md font-medium transition-all"
        :style="activeTab === tab
          ? 'background:#E8417B;color:white;'
          : 'background:#1E1E1E;border:1px solid #2A2A2A;color:rgba(255,255,255,0.5);'">
        {{ tab }}
      </button>
    </div>

    <!-- Carousel with center focus effect -->
    <div class="relative w-full" style="height:580px;cursor:grab;"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @touchstart.passive="startTouch"
      @touchmove.prevent="onTouch"
      @touchend="endTouch"
    >
      <div
        class="flex items-center transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        :style="{
          transform: `translateX(calc(50% - ${activeIndex * (cardWidth + gap)}px - ${cardWidth / 2}px))`,
          gap: gap + 'px',
        }"
      >
        <div
          v-for="(project, i) in projects"
          :key="project.name"
          @click="activeIndex = i"
          class="flex-shrink-0 flex flex-col overflow-hidden cursor-pointer transition-all duration-500"
          :style="{
            width: cardWidth + 'px',
            borderRadius: '24px',
            background: '#1E1E1E',
            border: '1px solid #2A2A2A',
            transform: i === activeIndex ? 'scale(1)' : 'scale(0.85)',
            opacity: i === activeIndex ? 1 : 0.4,
            boxShadow: i === activeIndex ? '0 32px 80px rgba(0,0,0,0.6)' : 'none',
          }"
        >
          <!-- Image -->
          <div class="overflow-hidden flex-shrink-0 w-full" :style="{ height: i === activeIndex ? '340px' : '280px', transition: 'height 0.5s ease' }">
            <img :src="project.img" :alt="project.name"
              class="w-full h-full object-cover object-top transition-transform duration-500"
              :class="i === activeIndex ? 'hover:scale-105' : ''" />
          </div>

          <!-- Info -->
          <div class="p-5 md:p-6 flex flex-col gap-2 flex-1">
            <h3 class="font-semibold" :class="i === activeIndex ? 'text-white text-lg md:text-xl' : 'text-white/50 text-base'">
              {{ project.name }}
            </h3>
            <!-- Line clamp untuk membatasi deskripsi di HP agar tingginya rapi -->
            <p class="text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none" :class="i === activeIndex ? 'text-white/70' : 'text-white/30'">
              {{ project.description }}
            </p>
            <div v-if="i === activeIndex" class="flex gap-2 flex-wrap mt-auto pt-2">
              <span v-for="tag in project.tags" :key="tag"
                class="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium"
                :style="tag === 'Mobile' ? 'background:#5B5CF6;color:white;' : 'background:#E8417B;color:white;'">
                <Icon :icon="tag === 'Mobile' ? 'solar:smartphone-bold' : 'solar:widget-bold'" class="w-3 h-3 md:w-4 md:h-4" />
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dot indicators -->
    <div class="flex justify-center gap-2 mt-6">
      <button v-for="(_, i) in projects" :key="i"
        @click="activeIndex = i"
        class="rounded-full transition-all duration-300"
        :style="i === activeIndex
          ? 'width:24px;height:8px;background:#E8417B;'
          : 'width:8px;height:8px;background:rgba(255,255,255,0.2);'" />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue' // Tambahkan onMounted & onUnmounted
import { Icon } from '@iconify/vue'
import rayspeedImg from '../assets/reyspeed.svg'
import buckstoreImg from '../assets/buckstore.svg'
import nashirImg from '../assets/nashir.svg'
import comproImg from '../assets/compro.svg'
import anomanImg from '../assets/anoman.svg'

const activeTab = ref('UI Design')
const activeIndex = ref(1)
const gap = 24

// UBAH: Jadikan cardWidth reaktif
const cardWidth = ref(480)

// FUNGSI BARU: Untuk mengatur ukuran kartu berdasarkan layar
const updateCardWidth = () => {
  if (window.innerWidth < 640) {
    // Layar HP: Lebar layar dikurangi padding 48px
    cardWidth.value = window.innerWidth - 48
  } else if (window.innerWidth < 1024) {
    // Layar Tablet
    cardWidth.value = 400
  } else {
    // Layar Desktop
    cardWidth.value = 480
  }
}

// Pantau perubahan ukuran layar
onMounted(() => {
  updateCardWidth()
  window.addEventListener('resize', updateCardWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCardWidth)
})

// Drag/swipe state
const isDragging = ref(false)
const dragStartX = ref(0)
const dragThreshold = 50

// Mouse drag
function startDrag(e) {
  isDragging.value = true
  dragStartX.value = e.clientX
}
function onDrag(e) {
  if (!isDragging.value) return
  e.preventDefault()
}
function endDrag(e) {
  if (!isDragging.value) return
  isDragging.value = false
  const diff = dragStartX.value - e.clientX
  if (diff > dragThreshold && activeIndex.value < projects.length - 1) {
    activeIndex.value++
  } else if (diff < -dragThreshold && activeIndex.value > 0) {
    activeIndex.value--
  }
}

// Touch swipe
function startTouch(e) {
  dragStartX.value = e.touches[0].clientX
}
function onTouch(e) {
  // Hanya prevent default jika gesernya horizontal agar tidak mengganggu scroll vertikal HP
  const touchY = e.touches[0].clientY
  // e.preventDefault() -> Dihapus sementara atau disesuaikan
}
function endTouch(e) {
  const diff = dragStartX.value - e.changedTouches[0].clientX
  if (diff > dragThreshold && activeIndex.value < projects.length - 1) {
    activeIndex.value++
  } else if (diff < -dragThreshold && activeIndex.value > 0) {
    activeIndex.value--
  }
}

const tabs = ['Printout Design', 'UI Design', 'Logo']

const projects = [
  {
    name: 'Buckstore',
    img: buckstoreImg,
    description: 'A streetwear e-commerce concept designed to create a bold, clean, and immersive shopping experience.',
    tags: ['Website', 'CMS'],
  },
  {
    name: 'Rayspeed Asia',
    img: rayspeedImg,
    description: 'Designing a clearer and more efficient international package delivery experience for customers and operational workflows.',
    tags: ['Mobile', 'CMS'],
  },
  {
    name: 'Nashir',
    img: nashirImg,
    description: 'A commerce platform built from scratch to simplify product sales, stock management, and business operations.',
    tags: ['CMS', 'Front Store'],
  },
  {
    name: 'Company Profile Tries',
    img: comproImg,
    description: 'A well-crafted company profile that reflects the brand identity and communicates services clearly.',
    tags: ['Website'],
  },
  {
    name: 'Anoman',
    img: anomanImg,
    description: 'A mobile dashboard product designed for clarity and intuitive user interaction.',
    tags: ['Mobile'],
  },
]
</script>