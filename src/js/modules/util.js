export const runOnLoad = (cb) => {
    document.addEventListener("DOMContentLoaded", cb, false)
};
