import { useState, useEffect, useCallback, useRef } from "react";
import { Pig } from "./Pig";
import { Fence } from "./Fence";
import { generateFence } from "./FenceGenerator";
import { GameUI } from "./GameUI";
import { FarmBackground } from "./FarmBackground";

const PIG_SPEED_X = 5;
const FENCE_SPEED = 2.5;
const FENCE_SPAWN_INTERVAL = 1600;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;

interface FenceData {
  id: number;
  y: number;
  gapStart: number;
  gapWidth: number;
  passed: boolean;
}

type CountdownAction = "resume" | "restart" | null;

export default function App() {
  const [renderState, setRenderState] = useState({
    pigX: GAME_WIDTH / 2,
    pigDirection: 1,
    score: 0,
    lastScore: 0,
    topScore: 0,
    fences: [] as FenceData[],
    isGameOver: false,
    showOnboarding: true,
    shakeX: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(3);

  const countdownActionRef = useRef<CountdownAction>("resume");
  const pausedAtRef = useRef<number | null>(performance.now());

  const gameStateRef = useRef({
    pigX: GAME_WIDTH / 2,
    pigDirection: 1,
    score: 0,
    lastScore: 0,
    topScore: 0,
    fences: [] as FenceData[],
    isGameOver: false,
    lastSpawnTime: 0,
    fenceId: 0,
    showOnboarding: true,
    impactFrames: 0,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const PIG_SIZE = 40;
  const FENCE_HEIGHT = 20;
  const PIG_Y = GAME_HEIGHT / 2 - PIG_SIZE / 2;

  const resetRun = useCallback(() => {
    const state = gameStateRef.current;
    state.lastScore = state.score;
    state.pigX = GAME_WIDTH / 2;
    state.pigDirection = 1;
    state.score = 0;
    state.fences = [];
    state.isGameOver = false;
    state.lastSpawnTime = performance.now();
    state.fenceId = 0;
    state.impactFrames = 0;
    state.showOnboarding = false;
  }, []);

  const vibrate = (pattern: number | number[]) => {
    if (!vibrationEnabled) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const playTone = useCallback(
    (freq: number, duration = 0.08, type: OscillatorType = "square") => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          if (!Ctx) return;
          audioCtxRef.current = new Ctx();
        }

        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.06;

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0.07, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch {
        // ignore audio errors silently
      }
    },
    [soundEnabled]
  );

  useEffect(() => {
    try {
      const savedTopScore = localStorage.getItem("piggyFlyTopScore");
      if (savedTopScore) {
        const parsedScore = parseInt(savedTopScore, 10);
        gameStateRef.current.topScore = parsedScore;
        setRenderState((prev) => ({ ...prev, topScore: parsedScore }));
      }

      const savedSound = localStorage.getItem("piggyFlySoundEnabled");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");

      const savedVibration = localStorage.getItem("piggyFlyVibrationEnabled");
      if (savedVibration !== null) setVibrationEnabled(savedVibration === "true");
    } catch (e) {
      console.error("Could not load saved settings", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("piggyFlySoundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("piggyFlyVibrationEnabled", String(vibrationEnabled));
  }, [vibrationEnabled]);

  const startCountdown = (action: Exclude<CountdownAction, null>) => {
    countdownActionRef.current = action;
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      const action = countdownActionRef.current;
      countdownActionRef.current = null;
      setCountdown(null);

      if (action === "restart") {
        resetRun();
      }

      // compensate spawn timing after pause so fences keep spacing
      const now = performance.now();
      if (pausedAtRef.current !== null) {
        const pausedDuration = now - pausedAtRef.current;
        gameStateRef.current.lastSpawnTime += pausedDuration;
        pausedAtRef.current = null;
      }

      setIsPaused(false);
      return;
    }

    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, resetRun]);

  const toggleDirection = useCallback(() => {
    const state = gameStateRef.current;

    if (isPaused || countdown !== null) return;

    if (state.showOnboarding) {
      state.showOnboarding = false;
    }

    if (state.isGameOver) {
      startCountdown("restart");
      return;
    }

    state.pigDirection *= -1;
    playTone(620, 0.05, "triangle");
  }, [playTone, isPaused, countdown]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleDirection();
      }
      if (e.code === "Escape") {
        e.preventDefault();
        if (!gameStateRef.current.isGameOver && countdown === null) {
          setIsPaused((p) => {
            const next = !p;
            if (next) pausedAtRef.current = performance.now();
            return next;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleDirection, countdown]);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const state = gameStateRef.current;
      let gameOverTriggered = false;
      let scoreTriggered = false;

      if (!state.isGameOver && !isPaused && countdown === null) {
        state.pigX += state.pigDirection * PIG_SPEED_X;

        if (state.pigX <= 0 || state.pigX + PIG_SIZE >= GAME_WIDTH) {
          state.isGameOver = true;
          setIsPaused(false);
          gameOverTriggered = true;
        }

        if (state.lastSpawnTime === 0) {
          state.lastSpawnTime = timestamp;
        }

        if (timestamp - state.lastSpawnTime > FENCE_SPAWN_INTERVAL) {
          const newFence = generateFence(GAME_WIDTH);
          state.fences.push({
            id: state.fenceId++,
            y: newFence.y,
            gapStart: newFence.gapStart,
            gapWidth: newFence.gapWidth,
            passed: false,
          });
          state.lastSpawnTime = timestamp;
        }

        state.fences = state.fences
          .map((fence) => ({ ...fence, y: fence.y + FENCE_SPEED }))
          .filter((fence) => fence.y < GAME_HEIGHT);

        state.fences.forEach((fence) => {
          const pigLeft = state.pigX;
          const pigRight = state.pigX + PIG_SIZE;
          const pigTop = PIG_Y;
          const pigBottom = PIG_Y + PIG_SIZE;

          const fenceTop = fence.y;
          const fenceBottom = fence.y + FENCE_HEIGHT;
          const gapLeft = fence.gapStart;
          const gapRight = fence.gapStart + fence.gapWidth;

          if (pigBottom > fenceTop && pigTop < fenceBottom) {
            if (pigRight <= gapLeft || pigLeft >= gapRight) {
              state.isGameOver = true;
              setIsPaused(false);
              gameOverTriggered = true;
            }
          }

          if (!fence.passed && fence.y > PIG_Y + PIG_SIZE) {
            fence.passed = true;
            state.score++;
            scoreTriggered = true;
          }
        });
      }

      if (scoreTriggered) {
        playTone(900, 0.06, "sine");
        vibrate(12);
      }

      if (gameOverTriggered) {
        state.impactFrames = 16;
        playTone(180, 0.16, "sawtooth");
        vibrate([50, 40, 50]);

        if (state.score > state.topScore) {
          state.topScore = state.score;
          try {
            localStorage.setItem("piggyFlyTopScore", state.topScore.toString());
          } catch (e) {
            console.error("Could not save top score", e);
          }
        }
      }

      let shakeX = 0;
      if (state.impactFrames > 0) {
        shakeX = (Math.random() - 0.5) * 12;
        state.impactFrames -= 1;
      }

      setRenderState({
        pigX: state.pigX,
        pigDirection: state.pigDirection,
        score: state.score,
        lastScore: state.lastScore,
        topScore: state.topScore,
        fences: state.fences,
        isGameOver: state.isGameOver,
        showOnboarding: state.showOnboarding,
        shakeX,
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [playTone, vibrationEnabled, isPaused, countdown]);

  return (
    <div className="w-full h-screen bg-sky-300 flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center">
        <div
          className="relative border-4 border-amber-900 overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT, transform: `translateX(${renderState.shakeX}px)` }}
          onMouseDown={toggleDirection}
          onTouchStart={toggleDirection}
        >
          <FarmBackground gameWidth={GAME_WIDTH} gameHeight={GAME_HEIGHT} />

          {renderState.showOnboarding && (
            <div className="absolute top-2 left-0 right-0 text-center z-30 pointer-events-none">
              <span className="text-[12px] md:text-sm font-bold text-white bg-black/45 px-3 py-1 rounded-full">
                Tap / Click / Space to change direction and avoid fences
              </span>
            </div>
          )}

          {!renderState.isGameOver && countdown === null && !isPaused && (
            <button
              type="button"
              className="absolute top-2 right-2 z-30 px-2 py-1 rounded bg-black/45 text-white text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                pausedAtRef.current = performance.now();
                setIsPaused(true);
              }}
            >
              ⏸ Pause
            </button>
          )}

          <Pig x={renderState.pigX} y={PIG_Y} direction={renderState.pigDirection} />

          {renderState.fences.map((fence) => (
            <Fence
              key={fence.id}
              y={fence.y}
              gapStart={fence.gapStart}
              gapWidth={fence.gapWidth}
              gameWidth={GAME_WIDTH}
            />
          ))}

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 text-5xl font-black leading-none select-none text-[#d7a14a] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
            {renderState.score}
          </div>

          <GameUI
            score={renderState.score}
            lastScore={renderState.lastScore}
            topScore={renderState.topScore}
            isGameOver={renderState.isGameOver}
            isPaused={isPaused}
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
            onToggleSound={() => setSoundEnabled((s) => !s)}
            onToggleVibration={() => setVibrationEnabled((v) => !v)}
            onResume={() => startCountdown("resume")}
            onRestart={() => startCountdown("restart")}
          />

          {countdown !== null && (
            <div className="absolute inset-0 z-50 bg-black/35 flex items-center justify-center pointer-events-none">
              <div
                className="text-white font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)] transition-all duration-500 ease-out"
                style={{
                  fontSize: "128px",
                  transform: `scale(${1 + (3 - Math.max(countdown, 1)) * 0.18})`,
                  opacity: 0.9,
                }}
              >
                {countdown}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
