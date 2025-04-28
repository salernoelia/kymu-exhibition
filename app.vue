<template>
  <div>
    <SlideTransition
      :active="isTransitioning"
      :text="transitionText"
    />

    <div class="parent">
      <Transition appear>
        <Menu v-if="menu">
          <div
            v-for="(exercise, index) in exerciseStore.exercises"
            :key="index"
            class="flex flex-col mb-2 gap-4"
          >
            <p>Debug - ID: {{ exercise.id }}</p>
            <Button @click="navigateTo(`/${exercise.id}/progress`)">
              Progress {{ exercise.name }}
            </Button>
            <Button @click="navigateTo(`/${exercise.id}/instruction`)">
              Instruction {{ exercise.name }}
            </Button>
            <Button @click="navigateTo(`/${exercise.id}/exercise`)">
              Exercise {{ exercise.name }}
            </Button>
          </div>
        </Menu>
      </Transition>

      <TopBar />
      <main class="pl-4 pr-4 w-full h-full">
        <NuxtPage
          @page-leave="onPageLeave"
          @page-enter="onPageEnter"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleFullscreen } = useFullscreen();
const { remoteKey } = useRemoteControl();
const route = useRoute();
const router = useRouter();
const exerciseStore = useExerciseStore();

const menu = ref(false);
const isTransitioning = ref(false);
const transitionText = ref('Loading...');

// Handle page transitions
const onPageLeave = (component) => {
  const routeName = component?.type?.name || 'New Page';
  transitionText.value = `Leaving ${routeName}`;
  isTransitioning.value = true;
};

const onPageEnter = (component) => {
  const routeName = component?.type?.name || 'New Page';
  transitionText.value = `Entering ${routeName}`;

  setTimeout(() => {
    isTransitioning.value = false;
  }, 1000);
};

watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    transitionText.value = `Loading ${getPageNameFromPath(newPath)}`;
    isTransitioning.value = true;


    setTimeout(() => {
      isTransitioning.value = false;
    }, 1000);
  }
});

const getPageNameFromPath = (path) => {
  if (path === '/') return 'Home Page';

  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
};

watch(
  () => remoteKey.value,
  (newKey) => {
    if (newKey === "menu") {
      console.log("Menu button pressed - toggling menu");
      menu.value = !menu.value;
    } else if (newKey === "back") {
      if (menu.value) {
        menu.value = false;
      } else if (route.path == "/tv") {
        console.log("already home");
      } else {
        router.back();
      }
    } else if (newKey === "fullscreen") {
      console.log("Fullscreen button pressed - toggling fullscreen");
      toggleFullscreen();
    } else if (newKey === "down") {
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