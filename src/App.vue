<template>
  <div class="min-h-screen" style="background:#1E1E1E;">
    <div class="max-w-[1200px] mx-auto px-5 lg:px-8">
      <NavBar />
      <HeroSection />
      <AboutSection />
      <!-- <SkillsSection /> -->
      <ExperienceSection />
      <ProjectsSection />
      <CTASection />
    </div>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
// import SkillsSection from './components/SkillsSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import CTASection from './components/CTASection.vue'
</script>
