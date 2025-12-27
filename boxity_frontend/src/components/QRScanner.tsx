import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  CameraDevice,
} from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Image, XCircle, RefreshCw } from "lucide-react";

export type QRScannerProps = {
  onDecoded: (text: string) => void;
  onError?: (err: Error | string) => void;
  onAutoScan?: () => void; // fired when a QR is detected (for success ping)
  elementId?: string; // DOM id for html5-qrcode container
  regionBox?: number; // scanning box size (px)
};

/**
 * Tighter sizing on large screens, roomy on mobile.
 * - Mobile: ~90vw square
 * - md: ~70vw
 * - lg: ~56vw
 * - xl+: hard cap at 560px (smaller than before)
 */
const frameCls =
  "relative w-[92vw] sm:w-[86vw] md:w-[70vw] lg:w-[56vw] max-w-[560px] aspect-square " +
  "bg-black rounded-3xl overflow-hidden border border-border shadow-2xl mx-auto";

export default function QRScanner({
  onDecoded,
  onError,
  onAutoScan,
  elementId = "qr-cam",
  regionBox = 260, // slightly smaller default so it doesn’t feel huge on laptops
}: QRScannerProps): JSX.Element {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pulse, setPulse] = useState<boolean>(false);

  const html5Ref = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef<boolean>(false);
  const firedRef = useRef<boolean>(false);

  const stopCamera = useCallback(async (): Promise<void> => {
    const html5 = html5Ref.current;
    if (!html5) return;
    const state = html5.getState();
    if (state === Html5QrcodeScannerState.SCANNING) {
      await html5.stop();
    }
    await html5.clear();
    setIsRunning(false);
  }, []);

  const startWithDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      try {
        const container = document.getElementById(elementId);
        if (container) container.innerHTML = "";

        const html5 = new Html5Qrcode(elementId, { verbose: false });
        html5Ref.current = html5;

        // Note: we intentionally omit `formatsToSupport` to satisfy TypeScript types.
        await html5.start(
          { deviceId: { exact: deviceId } },
          {
            fps: 12,
            qrbox: { width: regionBox, height: regionBox },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (!mountedRef.current) return;
            if (firedRef.current) return; // debounce multiple frames
            firedRef.current = true;

            // success pulse + notify
            setPulse(true);
            onAutoScan?.();

            // let the success glow show, then stop + emit
            setTimeout(() => {
              void stopCamera().finally(() => {
                onDecoded(decodedText);
                setTimeout(() => {
                  firedRef.current = false;
                  setPulse(false);
                }, 600);
              });
            }, 300);
          },
          // ignore frequent "no QR found" noise
          () => {}
        );

        setIsRunning(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        onError?.(msg);
      }
    },
    [elementId, regionBox, onDecoded, onError, onAutoScan, stopCamera]
  );

  const init = useCallback(async () => {
    try {
      const cams = await Html5Qrcode.getCameras();
      if (!cams || cams.length === 0) {
        setDevices([]);
        setErrorMsg("No cameras found. Try the image file option.");
        return;
      }
      // prefer rear on mobile if present
      let idx = 0;
      const rearIdx = cams.findIndex((c) =>
        (c.label || "").toLowerCase().includes("back")
      );
      if (rearIdx >= 0) idx = rearIdx;

      setDevices(cams);
      setCurrentIndex(idx);
      await startWithDevice(cams[idx].id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      onError?.(msg);
    }
  }, [onError, startWithDevice]);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== "undefined") void init();
    return () => {
      mountedRef.current = false;
      void stopCamera();
    };
  }, [init, stopCamera]);

  const flipCamera = async (): Promise<void> => {
    if (devices.length <= 1) return;
    const next = (currentIndex + 1) % devices.length;
    setCurrentIndex(next);
    await stopCamera();
    await startWithDevice(devices[next].id);
  };

  const restart = async (): Promise<void> => {
    if (devices.length === 0) {
      await init();
      return;
    }
    await stopCamera();
    await startWithDevice(devices[currentIndex].id);
  };

  const onFileChosen = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const h = html5Ref.current;
      if (!h) {
        setErrorMsg("Scanner not initialized");
        return;
      }
      if (isRunning) await stopCamera();
      const text = await h.scanFile(file, true);
      setPulse(true);
      onAutoScan?.();
      setTimeout(() => {
        onDecoded(text);
        setTimeout(() => setPulse(false), 600);
      }, 150);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      onError?.(msg);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Scanner frame */}
      <div className={frameCls} aria-label="QR camera preview">
        {/* html5-qrcode attaches the video to this div */}
        <div id={elementId} className="absolute inset-0" />

        {/* overlay: grid + corners */}
        <div className="pointer-events-none absolute inset-0">
          {/* vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />

          {/* animated scan box */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative"
              style={{ width: regionBox, height: regionBox }}
            >
              {/* corner brackets */}
              <div className="absolute -inset-3">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white/70 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white/70 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white/70 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white/70 rounded-br-lg" />
              </div>

              {/* scan line */}
              <AnimatePresence>
                {isRunning && !pulse && (
                  <motion.div
                    className="absolute left-0 right-0 h-1.5 bg-primary/90 drop-shadow-[0_0_16px_rgba(0,0,0,0.6)]"
                    initial={{ top: 0, opacity: 0.95 }}
                    animate={{ top: regionBox, opacity: 0.95 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* success flash */}
              <AnimatePresence>
                {pulse && (
                  <motion.div
                    className="absolute inset-0 bg-green-500/20 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* top status chip */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-xs">
              {isRunning
                ? "Camera active — point it at a QR"
                : "Starting camera…"}
            </div>
          </div>

          {/* bottom toolbar (clickable) */}
          <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={flipCamera}
              disabled={devices.length <= 1}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 hover:bg-white text-sm shadow"
              title={
                devices.length > 1 ? "Switch camera" : "Only one camera found"
              }
            >
              <RotateCw className="w-4 h-4" />
              {devices.length > 1 ? "Flip" : "No Flip"}
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 hover:bg-white text-sm shadow cursor-pointer">
              <Image className="w-4 h-4" />
              Upload QR
              <input
                type="file"
                accept="image/*"
                onChange={onFileChosen}
                className="hidden"
              />
            </label>

            <button
              onClick={restart}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 hover:bg-white text-sm shadow"
              title="Restart camera"
            >
              <RefreshCw className="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* subtle error */}
      {errorMsg && (
        <div className="mt-3 text-xs text-red-600 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
