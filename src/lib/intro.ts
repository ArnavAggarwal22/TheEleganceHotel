/** Lets the hero time its entrance after the first-load brand intro. */
let introDone = false;
export const introDelay = () => (introDone ? 0.15 : 1.9);
export const markIntroDone = () => { introDone = true; };
