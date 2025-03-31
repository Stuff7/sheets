import { watch, ref } from "jsx";

export const [canvasWidth, setCanvasWidth] = ref(0);
export const [canvasHeight, setCanvasHeight] = ref(0);

export const [prefersDark, setPrefersDark] = ref(
  matchMedia("(prefers-color-scheme: dark)").matches,
);

watch(() => {
  document.documentElement.classList[prefersDark() ? "add" : "remove"]("dark");
});
