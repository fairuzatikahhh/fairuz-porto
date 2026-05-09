<template>
  <div class="min-h-screen" style="background:#1E1E1E;">
    <div class="max-w-[1200px] mx-auto px-5 lg:px-8">
      <NavBar />
      
      <!-- HERO SECTION -->
      <section class="relative pt-12 md:pt-16 pb-8 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[80vh] overflow-hidden">
        <!-- Rankspeed Asia Text Background -->
        <div class="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none">
          <h1 class="text-white font-bold text-[25vw] md:text-[450px] whitespace-nowrap tracking-tighter">NASHIR</h1>
        </div>
        <!-- Mockup Image -->
        <div class="relative z-10 w-full max-w-xl md:max-w-3xl mx-auto px-4 mt-6">
          <img src="../assets/nashir/hero_mockup.png" alt="Nashir Mockup" class="w-full h-auto max-h-[60vh] md:max-h-[70vh] object-contain mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] rounded-3xl animate-float" />
        </div>
        <!-- Logo Text below -->
        <div class="relative z-10 mt-6 md:mt-8 text-center flex flex-col items-center">
          <img src="../assets/nashir/logo_nashir.svg" alt="Nashir Logo" class="h-10 md:h-14 w-auto" />
        </div>
      </section>

      <!-- Main Title -->
      <section class="py-24 text-center max-w-4xl mx-auto px-4">
        <h2 class="text-white font-medium text-3xl md:text-[44px] leading-[1.3]">
          A commerce platform built from scratch<br class="hidden md:block" />
          to simplify product sales and operations
        </h2>
      </section>

      <!-- Overview -->
      <section class="py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
        <div class="flex flex-col gap-6">
          <h3 class="text-white text-3xl md:text-4xl font-normal">Overview</h3>
          <p class="text-white/70 text-base md:text-lg leading-relaxed font-light">
            Nashir is a commerce platform built from scratch to simplify product sales, stock management, and business operations. It provides a robust architecture tailored to modern e-commerce needs, ensuring both vendors and customers experience a seamless journey.
          </p>
        </div>
        <div class="relative w-full rounded-[24px] shadow-2xl border border-white/5 overflow-hidden">
          <img src="../assets/nashir/overview_nashir.png" alt="Overview Mockup" class="w-full h-auto object-cover" />
        </div>
      </section>

      <!-- Goals -->
      <section class="pt-16 pb-12 flex flex-col items-center px-4 bg-goals-section bg-cover bg-center bg-no-repeat relative rounded-[24px]">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-6">Goals</h3>
        <p class="text-white/60 text-center max-w-2xl text-base md:text-lg mb-4 font-light leading-relaxed">
          Defining clear objectives to improve usability, flow,<br class="hidden md:block" />
          and system structure.
        </p>

        <!-- Goals Diagram -->
        <div class="relative w-full max-w-4xl mx-auto py-8 flex flex-col md:block justify-center items-center px-4 md:px-0">
          <!-- Concentric circles background -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden md:overflow-visible">
            <div class="w-[280px] h-[280px] rounded-full border border-white/5"></div>
            <div class="absolute w-[460px] h-[460px] rounded-full border border-white/10 hidden md:block"></div>
            <div class="absolute w-[640px] h-[640px] rounded-full border border-white/5 hidden md:block"></div>
          </div>
          
          <!-- Center Image -->
          <div class="relative z-10 w-[90%] md:w-full max-w-[800px] mx-auto mb-8 md:mb-0">
            <img src="../assets/nashir/goals_nashir.png" alt="App Goals" class="w-full h-auto rounded-[24px] md:rounded-[32px] object-cover" />
          </div>

          <!-- Goal Pointers Wrapper -->
          <div class="w-full grid grid-cols-2 gap-3 md:contents z-20 px-4 md:px-0">
            <div class="relative md:absolute md:top-[30%] md:-left-[5%] bg-white/5 backdrop-blur-md p-3 md:p-4 pr-5 rounded-[16px] md:rounded-[24px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto md:max-w-[280px] z-20 transition-transform animate-pulse-scale mx-auto" style="animation-delay: 0s;">
               <div class="bg-white/10 shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[16px] flex items-center justify-center text-white/90 border border-white/5"><Icon icon="solar:routing-2-bold" class="w-5 h-5 md:w-6 md:h-6" /></div>
               <p class="text-white/90 text-[13px] md:text-sm font-light leading-snug">Simplify stock and product management</p>
            </div>
            
            <div class="relative md:absolute md:top-[60%] md:-left-[5%] bg-white/5 backdrop-blur-md p-3 md:p-4 pr-5 rounded-[16px] md:rounded-[24px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto md:max-w-[280px] z-20 transition-transform animate-pulse-scale mx-auto" style="animation-delay: 0.75s;">
               <div class="bg-white/10 shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[16px] flex items-center justify-center text-white/90 border border-white/5"><Icon icon="solar:mouse-bold" class="w-5 h-5 md:w-6 md:h-6" /></div>
               <p class="text-white/90 text-[13px] md:text-sm font-light leading-snug">Support a clearer online shopping experience</p>
            </div>

            <div class="relative md:absolute md:top-[45%] md:-right-[2%] bg-white/5 backdrop-blur-md p-3 md:p-4 pr-5 rounded-[16px] md:rounded-[24px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto md:max-w-[280px] z-20 transition-transform animate-pulse-scale mx-auto" style="animation-delay: 1.5s;">
               <div class="bg-white/10 shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[16px] flex items-center justify-center text-white/90 border border-white/5"><Icon icon="solar:lightbulb-bold" class="w-5 h-5 md:w-6 md:h-6" /></div>
               <p class="text-white/90 text-[13px] md:text-sm font-light leading-snug">Improve stock visibility and control</p>
            </div>

            <div class="relative md:absolute md:bottom-[5%] md:left-[25%] bg-white/5 backdrop-blur-md p-3 md:p-4 pr-5 rounded-[16px] md:rounded-[24px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto md:max-w-[280px] z-20 transition-transform animate-pulse-scale mx-auto" style="animation-delay: 2.25s;">
               <div class="bg-white/10 shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[16px] flex items-center justify-center text-white/90 border border-white/5"><Icon icon="solar:layers-bold" class="w-5 h-5 md:w-6 md:h-6" /></div>
               <p class="text-white/90 text-[13px] md:text-sm font-light leading-snug">Reduce dependency on third-party platforms</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Design Process -->
      <section class="pt-32 pb-24 flex flex-col items-center px-4 border-t border-[#2A2A2A]">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-6">Design Process</h3>
        <p class="text-white/60 text-center max-w-2xl text-base md:text-lg mb-16 font-light leading-relaxed">
          A structured approach to shaping the product from<br class="hidden md:block" />
          flow to interface.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1000px] mx-auto">
          <!-- Card 1 -->
          <div class="bg-[#252525] rounded-[32px] p-10 flex flex-col items-center text-center hover:-translate-y-2 transition-all duration-300 shadow-xl border border-white/5">
            <div class="w-[60px] h-[60px] rounded-full bg-gradient-to-b from-[#E8417B] to-[#C2305E] flex items-center justify-center text-white mb-8 shadow-[0_10px_20px_rgba(232,65,123,0.3)]">
              <Icon icon="solar:layers-minimalistic-bold" class="w-7 h-7" />
            </div>
            <h4 class="text-white font-medium text-lg mb-4">Defining the Product<br/>Structure</h4>
            <p class="text-white/50 text-[15px] leading-[1.6] font-light">Organizing the core features, information, and navigation into a clear and logical structure to support how the product works as a whole.</p>
          </div>

          <!-- Card 2 -->
          <div class="bg-[#252525] rounded-[32px] p-10 flex flex-col items-center text-center hover:-translate-y-2 transition-all duration-300 shadow-xl border border-white/5">
            <div class="w-[60px] h-[60px] rounded-full bg-gradient-to-b from-[#E8417B] to-[#C2305E] flex items-center justify-center text-white mb-8 shadow-[0_10px_20px_rgba(232,65,123,0.3)]">
              <Icon icon="solar:routing-3-bold" class="w-7 h-7" />
            </div>
            <h4 class="text-white font-medium text-lg mb-4">Create intuitive user flows for key commerce actions</h4>
            <p class="text-white/50 text-[15px] leading-[1.6] font-light">Designing simple and easy-to-follow flows that help users complete key actions like product browsing, checkout, and inventory without confusion.</p>
          </div>

          <!-- Card 3 -->
          <div class="bg-[#252525] rounded-[32px] p-10 flex flex-col items-center text-center hover:-translate-y-2 transition-all duration-300 shadow-xl border border-white/5">
            <div class="w-[60px] h-[60px] rounded-full bg-gradient-to-b from-[#E8417B] to-[#C2305E] flex items-center justify-center text-white mb-8 shadow-[0_10px_20px_rgba(232,65,123,0.3)]">
              <Icon icon="solar:widget-5-bold" class="w-7 h-7" />
            </div>
            <h4 class="text-white font-medium text-lg mb-4">Establish a scalable UI<br/>foundation</h4>
            <p class="text-white/50 text-[15px] leading-[1.6] font-light">Building a consistent interface system that can grow with the product while maintaining clarity, usability, and visual consistency.</p>
          </div>
        </div>
      </section>

      <!-- The Challenge -->
      <section class="py-24 flex flex-col items-center text-center px-4 border-t border-[#2A2A2A]">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-8">The Challenge</h3>
        <p class="text-white/60 max-w-[900px] text-[17px] md:text-[20px] leading-[1.7] font-light">
          Designing a commerce platform from scratch meant translating complex sales and operational processes into something users could understand and navigate with ease. The challenge was to create an experience that felt structured, intuitive, and reliable across multiple touchpoints.
        </p>
      </section>

      <!-- The Result -->
      <section class="pt-24 pb-0 flex flex-col items-center text-center relative overflow-hidden bg-result-section bg-cover bg-bottom bg-no-repeat rounded-[48px] mb-12">
        <h3 class="text-white text-3xl md:text-[40px] font-normal mb-6 relative z-10 px-4">The Result</h3>
        <p class="text-white/60 max-w-[800px] text-[16px] md:text-[18px] leading-[1.7] font-light mb-6 relative z-10 px-8">
          The platform delivers a more structured and efficient commerce experience, improving how products and stock are managed while creating a clearer and more reliable shopping flow for customers.
        </p>
        
        <button class="relative z-10 bg-[#E8417B] hover:bg-[#C2305E] text-white font-medium px-8 py-3.5 rounded-full transition-colors duration-300 mb-6 shadow-[0_8px_16px_rgba(232,65,123,0.25)]">
          Visit Website
        </button>

        <!-- Result Phones Image -->
        <div class="relative w-full z-10 flex justify-center items-end mt-auto">
          <img src="../assets/nashir/result_nashir.png" alt="Nashir Result" class="w-[95%] md:w-[90%] max-w-[1100px] h-auto object-contain drop-shadow-2xl align-bottom hover:animate-shake cursor-pointer" />
        </div>
      </section>

      <Footer />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'

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
