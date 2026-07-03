<script setup lang="ts">
import { compasses } from '@/compasses'
import logoUrl from '@/assets/andaoai-logo-dark.svg'
</script>

<template>
  <div class="home">
    <header class="home-header">
      <img :src="logoUrl" alt="乙巳观 · AnDaoAi" class="home-logo" />
      <p class="subtitle">道由天观</p>
    </header>

    <div class="compass-grid">
      <RouterLink
        v-for="c in compasses"
        :key="c.id"
        :to="`/compass/${c.id}`"
        class="compass-card"
      >
        <span v-if="c.category" class="card-category">{{ c.category }}</span>
        <h2 class="card-name">{{ c.name }}</h2>
        <p class="card-desc">{{ c.description }}</p>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home {
  width: 100vw;
  min-height: 100vh;
  background-color: #0a0a0a;
  color: #e0e0e0;
  padding: 48px 24px;
  overflow-y: auto;
  box-sizing: border-box;
}

.home-header {
  text-align: center;
  margin-bottom: 48px;
}

.home-header h1 {
  font-size: 40px;
  letter-spacing: 0.3em;
  font-weight: 300;
  color: #fff;
}

.home-logo {
  width: 160px;
  height: 160px;
  display: block;
  margin: 0 auto;
  transition: transform 0.4s ease;
}

.home-logo:hover {
  transform: rotate(2deg) scale(1.02);
}

.subtitle {
  margin-top: 12px;
  color: #888;
  font-size: 15px;
  letter-spacing: 0.1em;
}

.compass-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.compass-card {
  display: block;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, transform 0.2s, background-color 0.2s;
}

.compass-card:hover {
  border-color: #888;
  background-color: #222;
  transform: translateY(-2px);
}

.card-category {
  display: inline-block;
  font-size: 12px;
  color: #C8A2E8;
  border: 1px solid #C8A2E8;
  border-radius: 4px;
  padding: 2px 8px;
  margin-bottom: 12px;
}

.card-name {
  font-size: 20px;
  font-weight: 400;
  color: #fff;
  margin-bottom: 10px;
}

.card-desc {
  font-size: 14px;
  color: #999;
  line-height: 1.6;
}
</style>
