<template>
  <div class="flex flex-row gap-4 items-center">
    <div
      v-for="(n, index) in total"
      :key="n"
      class="flex flex-row items-center gap-4"
    >
      <motion.div
        :initial="{ opacity: 0, scale: 0 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{
          duration: 0.4,
          delay: index * 0.3, // Sequential delay based on index
          scale: { type: 'spring', stiffness: 120, damping: 10 }
        }"
        :class="[
          'dot flex justify-center items-center',
          {
            completed: n <= current,
            ongoing: n === current + 1,
            upcoming: n > current + 1,
          },
        ]"
      >
        <motion.div
          v-if="n <= current"
          :initial="{ opacity: 0, scale: 0 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ delay: index * 0.3 + 0.2, duration: 0.3 }"
          class="flex items-center justify-center"
        >
          <Icon
            name="material-symbols-light:check-rounded"
            class="text-white h-8 w-8 icon-centered"
          />
        </motion.div>
      </motion.div>

      <!-- Animated line using SVG -->
      <motion.svg
        v-if="n !== total"
        width="50"
        height="2"
        :initial="{ strokeDashoffset: 50 }"
        :animate="{ strokeDashoffset: 0 }"
        :transition="{
          duration: 0.5,
          delay: index * 0.3 + 0.1,
          ease: 'easeInOut'
        }"
        class="line-svg"
      >
        <line
          x1="0"
          y1="1"
          x2="50"
          y2="1"
          stroke="var(--color-primaryNormal)"
          stroke-width="2"
          stroke-dasharray="50"
        />
      </motion.svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'

defineProps({
  current: {
    type: Number,
    default: 0,
    required: false,
  },
  total: {
    type: Number,
    default: 5,
  },
});
</script>

<style scoped lang="scss">
.dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  &.completed {
    background-color: var(--color-primaryNormal);
  }

  &.ongoing {
    background-color: var(--color-primaryNormal);
    opacity: 1;
  }

  &.upcoming {
    background-color: transparent;
    border: 2px solid var(--color-primaryNormal);
  }
}

.line-svg {
  display: block;
}

.icon-centered {
  display: flex;
  line-height: 0;
  vertical-align: middle;
}
</style>