import { type Variants } from 'framer-motion';

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export const fadeUp = (distance = 24, delay = 0): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: EASE_OUT } },
});

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE_OUT } },
};
