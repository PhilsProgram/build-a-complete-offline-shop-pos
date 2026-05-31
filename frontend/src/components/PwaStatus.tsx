import { Download, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaStatus() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const standaloneMode =
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    setStandalone(standaloneMode);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
    };

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    async function registerServiceWorker() {
      if (!("serviceWorker" in navigator)) return;

      try {
        const serviceWorkerRegistration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

        setRegistration(serviceWorkerRegistration);

        if (
          serviceWorkerRegistration.waiting &&
          navigator.serviceWorker.controller
        ) {
          setUpdateReady(true);
        }

        serviceWorkerRegistration.addEventListener("updatefound", () => {
          const worker = serviceWorkerRegistration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });
      } catch (error) {
        console.warn("PWA service worker registration failed.", error);
      }
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    // if (document.readyState === 'complete') {
    //   void registerServiceWorker();
    // } else {
    //   window.addEventListener('load', registerServiceWorker);
    // }

    // TEMPORARILY DISABLED
    // if (document.readyState === 'complete') {
    //   void registerServiceWorker();
    // } else {
    //   window.addEventListener('load', registerServiceWorker);
    // }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("load", registerServiceWorker);
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function activateUpdate() {
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    setUpdateReady(false);
  }

  if (standalone && online && !updateReady) {
    return null;
  }

  if (!installPrompt && online && !updateReady) {
    return null;
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[70] flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-2xl shadow-slate-300/30 backdrop-blur-xl">
      {!online && (
        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
            <WifiOff size={15} />
          </div>

          <div className="flex flex-col leading-tight">
            <span>Offline Mode</span>
            <span className="text-xs font-medium text-amber-700">
              Changes will sync later
            </span>
          </div>
        </div>
      )}

      {installPrompt && !standalone && (
        <Button
          type="button"
          onClick={() => void installApp()}
          className="h-11 rounded-xl px-4 text-sm font-semibold shadow-lg"
        >
          <Download size={16} />
          Install App
        </Button>
      )}

      {updateReady && (
        <Button
          type="button"
          variant="secondary"
          onClick={activateUpdate}
          className="h-11 rounded-xl px-4 text-sm font-semibold"
        >
          <RefreshCw size={16} />
          Update Ready
        </Button>
      )}
    </div>
  );
}
