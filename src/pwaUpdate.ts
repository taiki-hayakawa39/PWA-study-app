const updateEventName = "study-ledger-update-available";
const updateCheckIntervalMs = 60 * 60 * 1000;
const versionStorageKey = "study-ledger-app-version-v1";
const appBaseUrl = import.meta.env.BASE_URL;

const notifyUpdateAvailable = (detail: { registration?: ServiceWorkerRegistration; source: "service-worker" | "version" }) => {
  window.dispatchEvent(new CustomEvent(updateEventName, { detail }));
};

const checkAppVersion = async () => {
  try {
    const response = await fetch(`${appBaseUrl}version.json?checkedAt=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;

    const build = (await response.json()) as { version?: string };
    if (!build.version) return;

    const currentVersion = localStorage.getItem(versionStorageKey);
    if (!currentVersion) {
      localStorage.setItem(versionStorageKey, build.version);
      return;
    }

    if (currentVersion !== build.version) {
      notifyUpdateAvailable({ source: "version" });
    }
  } catch {
    // オフライン中は確認できないため、次回の表示時や定期チェックに任せます。
  }
};

export function registerAppServiceWorker() {
  if (import.meta.env.DEV) return;

  void checkAppVersion();
  window.setInterval(() => void checkAppVersion(), updateCheckIntervalMs);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkAppVersion();
    }
  });

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${appBaseUrl}sw.js`, { scope: appBaseUrl });

      if (registration.waiting && navigator.serviceWorker.controller) {
        notifyUpdateAvailable({ registration, source: "service-worker" });
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            notifyUpdateAvailable({ registration, source: "service-worker" });
          }
        });
      });

      window.setInterval(() => registration.update(), updateCheckIntervalMs);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void registration.update();
        }
      });
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  });
}
