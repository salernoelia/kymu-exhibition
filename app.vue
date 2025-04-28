<template>
  <div>
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
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleFullscreen } = useFullscreen();
const { remoteKey } = useRemoteControl();
const route = useRoute();
const exerciseStore = useExerciseStore();

const menu = ref(false);

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
        useRouter().back();
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

<style scoped>
body {
  overflow: hidden;
}

.parent {
  height: 100vh;
  align-items: center;
  overflow: hidden;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: 100%;
}

.page-enter-from {
  transform: translateX(100%);
}

.page-leave-to {
  transform: translateX(-100%);
}
</style>