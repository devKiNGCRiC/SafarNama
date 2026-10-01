// Loads and starts AOS (the "fade/zoom in as you scroll" library) exactly once for the whole
// app, however many components ask for it. Call this from a `useEffect` wherever a component
// renders `data-aos` elements.
//
// Previously almost a dozen components each did their own `import Aos from "aos"` and their own
// `Aos.init()` on mount. Because one of them (Footer) is rendered eagerly on nearly every page,
// that static import pulled the ~19 KB AOS library into the app's main bundle - downloaded on
// every single page view, including by people who never scroll past an animated element. Worse,
// every page navigation re-ran a full `Aos.init()`, which rescans the *entire* document for
// `[data-aos]` elements and rebuilds its scroll listeners, even on pages with just one or two.
//
// This loads AOS dynamically (so it is never in the main bundle) and only truly "init"s it once;
// every later caller just asks AOS to notice the new elements it just rendered.
let aosPromise = null;

export function ensureAos(options = {}) {
  if (!aosPromise) {
    aosPromise = import("aos").then(async (mod) => {
      await import("aos/dist/aos.css");
      const Aos = mod.default;
      Aos.init({ duration: 1000, once: true, disable: "mobile", ...options });
      return Aos;
    });
    return aosPromise;
  }
  // AOS is already starting (or started) elsewhere - just make sure it has scanned whatever
  // this component just rendered, without tearing down and rebuilding everything again.
  return aosPromise.then((Aos) => {
    Aos.refresh();
    return Aos;
  });
}
