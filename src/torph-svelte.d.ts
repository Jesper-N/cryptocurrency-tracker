declare module "torph/svelte" {
  import type { Component } from "svelte";

  interface SpringParams {
    stiffness?: number;
    damping?: number;
    mass?: number;
    precision?: number;
  }

  export interface TextMorphProps {
    text: string;
    debug?: boolean;
    locale?: Intl.LocalesArgument;
    scale?: boolean;
    duration?: number;
    ease?: string | SpringParams;
    disabled?: boolean;
    respectReducedMotion?: boolean;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    class?: string;
    style?: string;
    as?: string;
  }

  export const TextMorph: Component<TextMorphProps>;
}
