/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
  ],
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".center-full": {
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          width: "100%",
          height: "100%",
        },
        ".full": {
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
        },
      });
    },
  ],
};
