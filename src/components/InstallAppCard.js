import React, { useState, useEffect } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";

// The browser fires this once, early, so it is captured here at start-up
let deferredPrompt = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event("install-prompt-ready"));
  });
}

function InstallAppCard() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const [installed, setInstalled] = useState(false);

  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    const ready = () => setCanInstall(true);
    const done = () => setInstalled(true);
    window.addEventListener("install-prompt-ready", ready);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("install-prompt-ready", ready);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
  };

  if (standalone || installed) return null;
  if (!canInstall && !isIos) return null;

  return (
    <Card>
      <h3 className="font-semibold mb-1">Put this on your phone</h3>
      {canInstall ? (
        <>
          <p className="text-sm text-gray-500 mb-3">
            Open your account in one tap from your home screen, like any other
            app.
          </p>
          <Button onClick={install}>Install the app</Button>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          On iPhone: tap the <strong>Share</strong> button in Safari, then{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      )}
    </Card>
  );
}

export default InstallAppCard;
