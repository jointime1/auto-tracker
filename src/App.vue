<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from './composables/useTelegram'

const router = useRouter()
const { tg } = useTelegram()

let unsubscribeRouter: (() => void) | null = null

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

onMounted(() => {
  if (!tg) return

  tg.BackButton.onClick(goBack)

  unsubscribeRouter = router.afterEach((to) => {
    if (to.path === '/') {
      tg.BackButton.hide()
    } else {
      tg.BackButton.show()
    }
  })
})

onUnmounted(() => {
  tg?.BackButton.offClick(goBack)
  unsubscribeRouter?.()
})
</script>

<template>
  <div class="min-h-screen bg-tg-bg transition-colors">
    <router-view />
  </div>
</template>
