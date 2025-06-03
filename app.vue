<template>
  <div>
    <SlideTransition
      :active="isTransitioning"
      :text="transitionText"
    />

    <div class="parent">
      <Transition appear>
        <Menu v-if="menu">
          <div class="flex flex-row gap-4">
            <h3>
              Exercise Developer Mode
            </h3>
            <input
              id="exerciseDevmode"
              v-model="exerciseDevmode"
              type="checkbox"
              name="exerciseDevmode"
            >

          </div>
        </Menu>
      </Transition>

      <TopBar />
      <main
        class="pl-4 pr-4 w-full h-full"
        @click="resetInactivityTimer"
        @keydown="resetInactivityTimer"
        @touchstart="resetInactivityTimer"
      >
        <NuxtPage
          @page-leave="onPageLeave"
          @page-enter="onPageEnter"
        />
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'

const { remoteKey } = useRemoteControl();
const route = useRoute();
const exerciseStore = useExerciseStore();

const menu = ref(false);
const isTransitioning = ref(false);
const transitionText = ref('Loading...');
const exerciseDevmode = useStorage('exercise-devmode', false)


const INACTIVITY_TIMEOUT = 240000; // 4 minutes in ms
let inactivityTimer: NodeJS.Timeout | null = null;

const resetInactivityTimer = () => {
  if (route.path === '/') return;

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  inactivityTimer = setTimeout(() => {
    console.log('Inactivity timeout reached - resetting experience');
    exerciseStore.resetExperience();
  }, INACTIVITY_TIMEOUT);
};

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

const onPageLeave = (component: { type?: { name?: string } }) => {
  const routeName = component?.type?.name || 'New Page';
  transitionText.value = `Leaving ${routeName}`;
  isTransitioning.value = true;
  clearInactivityTimer();
};

const onPageEnter = (component: { type: { name: string; }; }) => {
  const routeName = component?.type?.name || 'New Page';
  transitionText.value = `Entering ${routeName}`;

  setTimeout(() => {
    isTransitioning.value = false;
  }, 1000);

  if (route.path !== '/') {
    resetInactivityTimer();
  }
};

watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    clearInactivityTimer();

    if (newPath === '/' ||
      newPath === '/caution' ||
      newPath === '/onboarding' ||
      newPath === '/results' ||
      newPath.includes('/instruction') ||
      newPath.includes('/progress')
    ) {
      isTransitioning.value = false;
      return;
    }

    transitionText.value = `Exercise ${exerciseStore.currentExercise?.name}`;
    isTransitioning.value = true;

    setTimeout(() => {
      isTransitioning.value = false;
    }, 3000);

    resetInactivityTimer();
  }
});

onMounted(() => {
  document.addEventListener('mousemove', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
});

onUnmounted(() => {
  clearInactivityTimer();
  document.removeEventListener('mousemove', resetInactivityTimer);
  document.removeEventListener('scroll', resetInactivityTimer);
});

watch(
  () => remoteKey.value,
  (newKey) => {
    resetInactivityTimer();

    if (newKey === "menu") {
      // console.log("Menu button pressed - toggling menu");
      // menu.value = !menu.value;
      exerciseDevmode.value = !exerciseDevmode.value;
    } else if (newKey === "reset") {
      exerciseStore.resetExperience();
    }
  }
);
</script>

<style scoped lang="scss">
body {
  overflow: hidden;
}

#circle {
  width: 100vw;
  aspect-ratio: 1/1;
  position: absolute;
  background-color: var(--color-primaryNormal);
  border-radius: 50%;
  transform: translateY(80%);
  bottom: 0;
}

.parent {
  height: 100vh;
  align-items: center;
  overflow: hidden;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>