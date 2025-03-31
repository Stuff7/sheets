import { watch, ref } from "jsx";

export const [canvasRect, setCanvasRect] = ref(new DOMRect());

export const [prefersDark, setPrefersDark] = ref(
  matchMedia("(prefers-color-scheme: dark)").matches,
);

watch(() => {
  document.documentElement.classList[prefersDark() ? "add" : "remove"]("dark");
});
