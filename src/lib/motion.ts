import type { Action } from "svelte/action";

export const enter: Action<HTMLElement, number | undefined> = (
  node,
  delay = 0,
) => {
  const ctl = node.animate(
    [
      { opacity: 0, transform: "translateY(5px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    {
      delay: delay * 1000,
      duration: 300,
      easing: "ease-out",
      fill: "forwards",
    },
  );

  return {
    destroy() {
      ctl.cancel();
    },
  };
};
