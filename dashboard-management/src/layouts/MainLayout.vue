<script setup>
import { reactive, watch } from 'vue'

const app = reactive({
    direction: 'ltr',
    mode: 'light',
    sidebarMode: 'expanded'
})

watch(
    () => app.direction,
    val => document.documentElement.setAttribute('dir', val),
    { immediate: true }
)

watch(
    () => app.mode,
    val => document.documentElement.dataset.mode = val,
    { immediate: true }
)

watch(
    () => app.sidebarMode,
    val => document.documentElement.dataset.sidebar = val,
    { immediate: true }
)
</script>

<template>
    <div class="group/item">
        <slot></slot> <!-- tempat komponen lain masuk -->
    </div>
</template>

<style scoped>
/* optional styling */
</style>
