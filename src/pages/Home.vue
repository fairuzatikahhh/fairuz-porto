<template>
  <div class="max-w-[1200px] mx-auto px-5 lg:px-8">
    <NavBar />
    <HeroSection />
    <AboutSection />
    <ExperienceSection />
    <ProjectsSection />
    <CTASection />
    <Footer />
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import AboutSection from '../components/AboutSection.vue'
import ExperienceSection from '../components/ExperienceSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import CTASection from '../components/CTASection.vue'
import Footer from '../components/Footer.vue'
</script>
