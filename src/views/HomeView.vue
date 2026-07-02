<script setup lang="ts">
import { compasses } from '@/compasses'
</script>

<template>
  <div class="home">
    <header class="home-header">
      <h1>乙巳观</h1>
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
  color: #d4af37;
  border: 1px solid #d4af37;
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
