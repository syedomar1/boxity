// src/pages/Index.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Package,
  Scan,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  Star,
} from "lucide-react";
import { Box3D } from "@/components/Box3D";
import Cubes from "@/components/Cubes";
import { GlassCard } from "@/components/GlassCard";
import { QRScanAnimator } from "@/components/QRScanAnimator";
import { Walkthrough } from "@/components/Walkthrough";
import ParticleField from "@/components/ParticleField";
import FloatingElements from "@/components/FloatingElements";
import GradientBackground from "@/components/GradientBackground";
import AnimatedText, { TypewriterText } from "@/components/AnimatedText";
import InteractiveCard from "@/components/InteractiveCard";
import { useState, useRef } from "react";

/**
 * Final enhanced Index page
 * - Uses framer-motion for tilt effect (no extra dependency)
 * - Compact hero copy, strong CTA
 * - Right visual tile preserved (Cubes)
 * - Rest of sections intact and responsive
 */

const Index = () => {
  const navigate = useNavigate();
  const [showTimeline, setShowTimeline] = useState(false);

  // small interactive tilt values (framer-motion) — no external tilt lib needed
  const cardRef = useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateY = useTransform(mouseX, [-100, 100], [12, -12]);
  const rotateX = useTransform(mouseY, [-100, 100], [-8, 8]);
  const shadowX = useTransform(mouseX, [-100, 100], [-40, 40]);
  const shadowY = useTransform(mouseY, [-100, 100], [-30, 30]);

  const handleMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    // normalize approx to -100..100
    const nx = Math.max(-120, Math.min(120, (x / (rect.width / 2)) * 100));
    const ny = Math.max(-120, Math.min(120, (y / (rect.height / 2)) * 100));
    mouseX.set(nx);
    mouseY.set(ny);
  };

  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleScanComplete = () => {
    setShowTimeline(true);
    setTimeout(() => setShowTimeline(false), 4500);
  };

  const walkthroughSteps = [
    {
      target: "try-it-out-btn",
      title: "Try It Out",
      description:
        "Create a batch, generate a QR and experience verification end-to-end",
      position: "bottom" as const,
    },
    {
      target: "simulate-scan-btn",
      title: "Simulate QR Scan",
      description: "Experience the scanning animation and see timeline preview",
      position: "top" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Walkthrough steps={walkthroughSteps} storageKey="home-walkthrough" />

      {/* Decorative backgrounds */}
      <GradientBackground />
      <ParticleField />
      <FloatingElements />

      {/* HERO */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20 relative z-20">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          {/* LEFT: concise, bold */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-3 rounded-full px-3 py-2 bg-white/80 dark:bg-white/6 backdrop-blur-sm border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Next-Gen Supply Chain Verification
              </span>
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                Boxity
              </span>
              <span className="block mt-2 text-slate-900 dark:text-slate-100">
                Trust what you track — Scan. Verify. Believe.
              </span>
            </h1>

            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-lg">
              Assign a QR-backed digital identity, capture baseline photos,
              verify each handoff with explainable AI, and persist proofs on a
              tamper-proof ledger.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <Button
                id="try-it-out-btn"
                size="lg"
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-indigo-500 shadow-lg hover:scale-[1.01] transition-transform"
                onClick={() => navigate("/admin")}
              >
                Try it out
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                id="simulate-scan-btn"
                size="lg"
                variant="outline"
                className="px-5 py-3"
                onClick={() => navigate("/verify")}
              >
                Verify Batch
              </Button>

              <div className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium">No hardware •</span> mobile-first
              </div>
            </div>

            {/* short badges */}
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: Globe, label: "Global" },
                { icon: Lock, label: "Secure" },
                { icon: Package, label: "Provenance" },
                { icon: Scan, label: "Instant" },
              ].map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white/70 dark:bg-white/4 border border-primary/8 text-sm"
                >
                  <b.icon className="w-4 h-4 text-primary" />
                  <span className="text-slate-700 dark:text-slate-200">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: interactive visual tile (tilt via framer-motion) */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <motion.div
              style={{
                rotateY,
                rotateX,
                boxShadow: "0px 10px 30px rgba(16,24,40,0.12)",
                translateZ: 0,
              }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="w-full max-w-[520px] rounded-2xl"
            >
              <div
                className="relative rounded-2xl overflow-hidden border border-white/10 dark:border-white/6
                           shadow-2xl bg-white/70 dark:bg-gradient-to-b dark:from-[#071029] dark:via-[#071023] dark:to-[#071022] p-4"
              >
                {/* Top meta row */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-bold">
                      BT
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        CHT-001-ABC
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        VitaTabs • Batch
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Last: 4h
                  </div>
                </div>

                {/* Main visual */}
                <div className="mt-3 px-3 pb-4">
                  <div className="relative rounded-xl overflow-hidden p-3 bg-gradient-to-br from-white/60 to-white/20 dark:from-black/40 dark:via-black/30">
                    {/* live badge */}
                    <div className="absolute left-3 top-3 text-xs bg-black/10 dark:bg-white/6 rounded-md px-2 py-1 text-slate-800 dark:text-slate-100">
                      Live Demo
                    </div>

                    <div className="flex items-center justify-center h-[220px] md:h-[260px]">
                      <Cubes
                        gridSize={7}
                        maxAngle={45}
                        radius={3.2}
                        borderStyle="1px solid rgba(82,39,255,0.9)"
                        faceColor="transparent"
                        rippleColor="#6EE7B7"
                        rippleSpeed={1.1}
                        autoAnimate={true}
                        rippleOnClick={true}
                      />
                    </div>

                    {/* bottom row status + actions */}
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Integrity: <span className="text-green-600">89</span>
                          <span className="text-slate-500 text-xs ml-2">
                            TIS
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Last: QuickShip • Verified
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary/90 text-white text-sm shadow"
                          onClick={() => navigate("/verify")}
                        >
                          <Scan className="w-4 h-4" /> Verify
                        </button>

                        <button
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/30 dark:bg-white/5 border border-white/6 text-sm text-slate-800 dark:text-slate-200"
                          onClick={() => navigate("/admin")}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* QR Scan Simulator */}
      <section className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Try It Now
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Experience our QR scanning technology with this interactive demo
            </p>
          </div>

          <div className="w-full max-w-md">
            <QRScanAnimator onScanComplete={handleScanComplete} />
          </div>

          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-4 bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg"
            >
              <p className="text-sm text-muted-foreground mb-2">
                Preview Timeline:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  SwiftCargo - Dispatched
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  MegaMart - Verified intact
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* How it works (3 cards) */}
      <section className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              How it works
            </span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
            Three simple steps to run provenance verification
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Package,
                title: "Create",
                desc: "Register batch & generate QR",
                detail:
                  "Add product details, baseline photos, and a verifiable digital identity.",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Scan,
                title: "Scan & Log",
                desc: "Every handoff captured",
                detail:
                  "Actors upload photos + notes; events are hashed & recorded.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: ShieldCheck,
                title: "Verify",
                desc: "Consumer + Regulator Trust",
                detail: "Scan QR to see journey, TIS & cryptographic proofs.",
                color: "from-purple-500 to-pink-500",
              },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <InteractiveCard delay={i * 0.12}>
                  <GlassCard className="h-full">
                    <div className="p-6 text-center">
                      <div
                        className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}
                      >
                        <s.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                      <p className="text-primary font-medium mb-2">{s.desc}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.detail}
                      </p>
                    </div>
                  </GlassCard>
                </InteractiveCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features + CTA */}
      <section className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Boxity?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl">
              Explainable AI, blockchain anchoring, and consumer-facing
              transparency — all in a mobile-first package.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Zap, title: "Lightning Fast" },
                { icon: ShieldCheck, title: "Bank-Level Security" },
                { icon: Globe, title: "Global Reach" },
                { icon: Star, title: "Easy Integration" },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-3 bg-white/70 dark:bg-white/4 rounded-lg px-4 py-3"
                >
                  <f.icon className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">{f.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Trusted by supply chain operators
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold">Ready to build trust?</h3>
              <p className="text-muted-foreground">
                Start tracking products and reduce fraud with visual
                verification.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-500"
                onClick={() => navigate("/admin")}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/verify")}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
