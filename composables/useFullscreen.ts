export function useFullscreen() {
  const toggle = () => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
        console.log("Fullscreen activated");
      }
    } else {
      console.log("Fullscreen already active, staying in fullscreen");
    }

    console.log("Fullscreen toggled");
  };

  return { toggle };
}