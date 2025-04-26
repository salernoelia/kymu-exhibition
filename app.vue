<template>
  <div>
    <div class="parent">
      <Transition appear>
        <Menu v-if="menu">
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
    }
  }
);

</script>

<style scoped>
body {
  overflow: hidden;
}

.parent {
  display: flex;
  flex-direction: column;
  position: absolute;
  inset: 0;
  justify-content: center;
  align-items: center;
}
</style>