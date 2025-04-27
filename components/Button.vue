<script setup lang="ts">
interface Props {
  variant?:
  | "primary"
  | "secondary"
  | "tertiary"
  | "icon"
  | "text"
  | "outline"
  | "danger";
  disabled?: boolean;
  iconRight?: string;
  iconLeft?: string;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  iconLeft: "",
  iconRight: "",
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const buttonClasses = computed(() => {
  return {
    // base
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors":
      true,
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2": true,
    "disabled:opacity-50 disabled:pointer-events-none": true,

    // variants
    "bg-[var(--color-primaryNormal)] text-white hover:bg-[var(--color-primaryNormalHover)] active:bg-[var(--color-primaryNormalActive)]":
      props.variant === "primary",
    "bg-[var(--color-dangerNormal)] text-white hover:bg-[var(--color-dangerNormalHover)] active:bg-[var(--color-dangerNormalActive)]":
      props.variant === "danger",
    "bg-[var(--color-secondaryNormal)] text-white hover:bg-[var(--color-secondaryNormalHover)] active:bg-[var(--color-secondaryNormalActive)]":
      props.variant === "secondary",
    "bg-[var(--color-tertiaryNormal)] text-[var(--color-primaryDark)] hover:bg-[var(--color-tertiaryNormalHover)] active:bg-[var(--color-tertiaryNormalActive)]":
      props.variant === "tertiary",
    "bg-[var(--color-tertiaryLight)] text-[var(--color-primaryNormal)] hover:bg-[var(--color-tertiaryLightHover)] active:bg-[var(--color-tertiaryLightActive)]":
      props.variant === "icon",
    "bg-transparent text-[var(--color-primaryNormal)] hover:underline hover:text-[var(--color-primaryNormalHover)]":
      props.variant === "text",
    "border border-[var(--color-primaryNormal)] text-[var(--color-primaryNormal)] hover:bg-[var(--color-primaryNormal)] hover:text-white active:bg-[var(--color-primaryNormalActive)]":
      props.variant === "outline",

    // sizes
    "text-xs px-3 py-1.5": props.size === "sm",
    "text-sm px-4 py-2": props.size === "md",
    "text-base px-6 py-3": props.size === "lg",
  };
});
</script>

<template>
  <button :class="buttonClasses" :disabled="disabled" @click="(e) => emit('click', e)">
    <Icon v-if="iconLeft" class="mr-2 h-4 w-4" :name="iconLeft" />
    <slot></slot>

    <Icon v-if="iconRight" class="ml-2 h-4 w-4" :name="iconRight" />
  </button>
</template>
