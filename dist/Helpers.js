export function FireOnDomReady(func) {
    if (document.readyState === "complete") {
        func();
    }
    else {
        window.addEventListener("DOMContentLoaded", func);
    }
}
//# sourceMappingURL=Helpers.js.map