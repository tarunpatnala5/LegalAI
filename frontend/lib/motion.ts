/* Shared animation variants and spring configs for Framer Motion
   Inspired by Apple's motion design philosophy:
   - Responsive, never bouncy
   - Natural acceleration/deceleration
   - Spring-based, not duration-based
*/

import type { Transition, Variants } from "framer-motion";

/* ── Spring Configs ──────────────────────────────────────── */

/** Apple's signature responsive spring — snappy, no bounce */
export const appleSpring: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
};

/** Softer spring for modals, sheets, overlays */
export const appleSoftSpring: Transition = {
    type: "spring",
    stiffness: 200,
    damping: 24,
};

/** Very gentle spring for page-level transitions */
export const appleGentleSpring: Transition = {
    type: "spring",
    stiffness: 120,
    damping: 20,
};

/* ── Variants ────────────────────────────────────────────── */

/** Fade in from below — cards, sections */
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: appleSpring,
    },
};

/** Fade in from above — dropdowns */
export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: appleSpring,
    },
};

/** Scale in — modals, dialogs */
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: appleSoftSpring,
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.15, ease: "easeIn" },
    },
};

/** Stagger container for list items */
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.04,
        },
    },
};

/** Individual stagger child */
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: appleSpring,
    },
};

/** Slide in from bottom — iOS sheets */
export const slideInFromBottom: Variants = {
    hidden: { y: "100%" },
    visible: {
        y: 0,
        transition: appleSoftSpring,
    },
    exit: {
        y: "100%",
        transition: { duration: 0.2, ease: "easeIn" },
    },
};

/** Slide in from left — mobile drawers */
export const slideInFromLeft: Variants = {
    hidden: { x: "-100%" },
    visible: {
        x: 0,
        transition: appleSoftSpring,
    },
    exit: {
        x: "-100%",
        transition: { duration: 0.2, ease: "easeIn" },
    },
};

/** Backdrop fade */
export const backdropFade: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Page transition */
export const pageTransition: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 28,
            delay: 0.05,
        },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.12 },
    },
};
