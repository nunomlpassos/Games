import { useState, useEffect, useCallback, useRef } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { App as CapacitorApp } from "@capacitor/app";
import { Pig } from "./Pig";
import { Fence } from "./Fence";
import { generateFence } from "./FenceGenerator";
import { GameUI } from "./GameUI";
import { FarmBackground } from "./FarmBackground";

const PIG_SPEED_X = 4.4;
const FENCE_SPEED = 2.1;
const FENCE_SPAWN_INTERVAL = 1800;
const FIRST_FENCE_DELAY = 550;
const PIG_SIZE = 42;
const FENCE_HEIGHT = 24;
const CRASH_DURATION_MS = 900;
const OPENING_FENCE_Y_RATIO = 0.18; // first fence starts already visible
const FRAME_MS = 1000 / 60;

interface FenceData {
  id: number;
  y: number;
  gapStart: number;
  gapWidth: number;
  passed: boolean;
}

type CountdownAction = "resume" | "restart" | null;
type ExitReturnState = "playing" | "paused" | "gameover" | null;

const getViewportSize = () => ({
  width: Math.max(320, window.innerWidth),
  height: Math.max(500, window.innerHeight),
});

interface CircleHitbox {
  x: number;
  y: number;
  r: number;
}

interface RectHitbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const circleIntersectsRect = (circle: CircleHitbox, rect: RectHitbox) => {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
};

const pigHitCircles = (pigX: number, pigY: number, pigSize: number): CircleHitbox[] => {
  const body: CircleHitbox = {
    x: pigX + pigSize * 0.5,
    y: pigY + pigSize * 0.54,
    r: pigSize * 0.45,
  };

  const leftEar: CircleHitbox = {
    x: pigX + pigSize * 0.205,
    y: pigY + pigSize * 0.175,
    r: pigSize * 0.125,
  };

  const rightEar: CircleHitbox = {
    x: pigX + pigSize * 0.795,
    y: pigY + pigSize * 0.175,
    r: pigSize * 0.125,
  };

  return [body, leftEar, rightEar];
};

export default function App() {
  const [gameSize, setGameSize] = useState(() =>
    typeof window === "undefined" ? { width: 400, height: 700 } : getViewportSize()
  );

  const [renderState, setRenderState] = useState({
    pigX: gameSize.width / 2,
    pigDirection: 1,
    score: 0,
    lastScore: 0,
    topScore: 0,
    fences: [] as FenceData[],
    isGameOver: false,
    showOnboarding: true,
    shakeX: 0,
    crashRotation: 0,
    crashOffsetY: 0,
    showGameOverMenu: false,
    isNewBest: false,
    canRestartFromGameOver: false,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const exitReturnStateRef = useRef<ExitReturnState>(null);

  const countdownActionRef = useRef<CountdownAction>(null);
  const pausedAtRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);

  const gameStateRef = useRef({
    pigX: gameSize.width / 2,
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
    hasSpawnedFirstFence: false,
    crashActive: false,
    crashStartAt: 0,
    crashFinalOffsetY: 0,
    showGameOverMenu: false,
    isNewBest: false,
    gameOverReadyAt: 0,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const PIG_Y = gameSize.height / 2 - PIG_SIZE / 2;

  useEffect(() => {
    const onResize = () => {
      const next = getViewportSize();
      setGameSize(next);
      setIsLandscape(next.width > next.height);

      const state = gameStateRef.current;
      state.pigX = Math.min(next.width - PIG_SIZE, Math.max(0, state.pigX));
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (screen.orientation?.lock) {
      screen.orientation.lock("portrait").catch(() => {});
    }
  }, []);

  const triggerVibration = useCallback(
    (kind: "score" | "impact") => {
      if (!vibrationEnabled) return;
      const isNative = !!(window as any)?.Capacitor?.isNativePlatform?.();

      if (isNative) {
        if (kind === "impact") Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        else Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        return;
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        if (kind === "impact") navigator.vibrate([45, 35, 45]);
        else navigator.vibrate(12);
      }
    },
    [vibrationEnabled]
  );

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
        gainNode.gain.value = 0.065;

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0.075, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch {
        // ignore audio errors silently
      }
    },
    [soundEnabled]
  );

  const playPigHitSound = useCallback(() => {
    playTone(420, 0.08, "sawtooth");
    setTimeout(() => playTone(340, 0.11, "triangle"), 70);
  }, [playTone]);

  const seedOpeningFence = useCallback(() => {
    const state = gameStateRef.current;
    const opening = generateFence(gameSize.width);
    const openingY = Math.floor(gameSize.height * OPENING_FENCE_Y_RATIO);

    state.fences = [
      {
        id: state.fenceId++,
        y: openingY,
        gapStart: opening.gapStart,
        gapWidth: opening.gapWidth,
        passed: false,
      },
    ];

    // Keep spacing rhythm equal to previous versions:
    // first fence starts already advanced, so delay next spawn accordingly.
    const advancedPx = openingY + FENCE_HEIGHT;
    const extraDelayMs = (advancedPx / FENCE_SPEED) * FRAME_MS;
    state.lastSpawnTime = performance.now() + extraDelayMs;

    state.hasSpawnedFirstFence = true;
  }, [gameSize.width, gameSize.height]);

  const resetRun = useCallback(() => {
    const state = gameStateRef.current;
    state.lastScore = state.score;
    state.pigX = gameSize.width / 2;
    state.pigDirection = 1;
    state.score = 0;
    state.fences = [];
    state.isGameOver = false;
    state.lastSpawnTime = performance.now();
    state.fenceId = 0;
    state.impactFrames = 0;
    state.showOnboarding = false;
    state.hasSpawnedFirstFence = false;
    state.crashActive = false;
    state.crashStartAt = 0;
    state.crashFinalOffsetY = 0;
    state.showGameOverMenu = false;
    state.isNewBest = false;
    state.gameOverReadyAt = 0;

    seedOpeningFence();
  }, [gameSize.width, seedOpeningFence]);

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

  const startCountdown = useCallback((action: Exclude<CountdownAction, null>) => {
    countdownActionRef.current = action;
    setIsPaused(false);
    gameStateRef.current.showGameOverMenu = false;
    setCountdown(3);
  }, []);

  const handleExitNo = useCallback(() => {
    setShowExitConfirm(false);

    const previous = exitReturnStateRef.current;
    if (previous === "paused") {
      setIsPaused(true);
    } else if (previous === "gameover") {
      gameStateRef.current.showGameOverMenu = true;
      setIsPaused(false);
    } else if (previous === "playing" && hasStarted && !gameStateRef.current.isGameOver) {
      startCountdown("resume");
    }

    exitReturnStateRef.current = null;
  }, [hasStarted, startCountdown]);

  const openExitConfirm = useCallback(() => {
    if (showExitConfirm) return;

    const state = gameStateRef.current;
    if (state.showGameOverMenu || state.isGameOver) {
      exitReturnStateRef.current = "gameover";
    } else if (isPaused) {
      exitReturnStateRef.current = "paused";
    } else {
      exitReturnStateRef.current = "playing";
      if (hasStarted && countdown === null) {
        pausedAtRef.current = performance.now();
        setIsPaused(true);
      }
    }

    setShowExitConfirm(true);
  }, [showExitConfirm, isPaused, hasStarted, countdown]);

  useEffect(() => {
    const isNative = !!(window as any)?.Capacitor?.isNativePlatform?.();
    if (!isNative) return;

    const subPromise = CapacitorApp.addListener("backButton", () => {
      if (showExitConfirm) {
        handleExitNo();
        return;
      }
      openExitConfirm();
    });

    return () => {
      subPromise.then((s) => s.remove()).catch(() => {});
    };
  }, [showExitConfirm, openExitConfirm, handleExitNo]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      const action = countdownActionRef.current;
      countdownActionRef.current = null;
      setCountdown(null);

      if (action === "restart") resetRun();

      const now = performance.now();
      if (pausedAtRef.current !== null) {
        const pausedDuration = now - pausedAtRef.current;
        gameStateRef.current.lastSpawnTime += pausedDuration;
        pausedAtRef.current = null;
      }
      return;
    }

    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, resetRun]);

  const toggleDirection = useCallback(() => {
    const state = gameStateRef.current;
    if (!hasStarted || isPaused || countdown !== null || isLandscape || showExitConfirm) return;

    if (state.showOnboarding) state.showOnboarding = false;

    // Restart from game-over must only happen via the Game Over button.
    if (state.isGameOver) return;

    state.pigDirection *= -1;
    playTone(620, 0.05, "triangle");
  }, [playTone, hasStarted, isPaused, countdown, isLandscape, showExitConfirm]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const now = performance.now();
      if (now - lastTapRef.current < 120) return;
      lastTapRef.current = now;
      e.preventDefault();
      toggleDirection();
    },
    [toggleDirection]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!hasStarted) {
          setHasStarted(true);
          startCountdown("resume");
          return;
        }
        toggleDirection();
      }
      if (e.code === "Escape") {
        e.preventDefault();
        if (showExitConfirm) {
          handleExitNo();
          return;
        }
        openExitConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleDirection, hasStarted, showExitConfirm, handleExitNo, openExitConfirm, startCountdown]);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const state = gameStateRef.current;
      let gameOverTriggered = false;
      let scoreTriggered = false;

      let crashRotation = 0;
      let crashOffsetY = state.crashFinalOffsetY;

      if (state.crashActive) {
        const elapsed = timestamp - state.crashStartAt;
        const p = Math.min(1, elapsed / CRASH_DURATION_MS);
        crashRotation = 720 * p;
        crashOffsetY = p * (gameSize.height - PIG_Y + 80);
        if (p >= 1) {
          state.crashActive = false;
          state.crashFinalOffsetY = crashOffsetY;
          state.showGameOverMenu = true;
        }
      } else if (state.isGameOver) {
        crashRotation = 720;
      }

      if (hasStarted && !state.isGameOver && !isPaused && countdown === null && !isLandscape) {
        state.pigX += state.pigDirection * PIG_SPEED_X;

        if (state.pigX <= 0 || state.pigX + PIG_SIZE >= gameSize.width) {
          state.isGameOver = true;
          state.crashActive = true;
          state.crashStartAt = timestamp;
          state.crashFinalOffsetY = 0;
          state.showGameOverMenu = false;
          setIsPaused(false);
          gameOverTriggered = true;
        }

        if (state.lastSpawnTime === 0) state.lastSpawnTime = timestamp;

        const currentInterval = state.hasSpawnedFirstFence ? FENCE_SPAWN_INTERVAL : FIRST_FENCE_DELAY;
        if (timestamp - state.lastSpawnTime > currentInterval) {
          const newFence = generateFence(gameSize.width);
          state.fences.push({ id: state.fenceId++, y: newFence.y, gapStart: newFence.gapStart, gapWidth: newFence.gapWidth, passed: false });
          state.lastSpawnTime = timestamp;
          state.hasSpawnedFirstFence = true;
        }

        state.fences = state.fences.map((f) => ({ ...f, y: f.y + FENCE_SPEED })).filter((f) => f.y < gameSize.height);

        state.fences.forEach((fence) => {
          const fenceTop = fence.y;
          const gapLeft = fence.gapStart;
          const gapRight = fence.gapStart + fence.gapWidth;

          const leftFenceRect: RectHitbox = {
            x: 0,
            y: fenceTop,
            w: Math.max(0, gapLeft),
            h: FENCE_HEIGHT,
          };

          const rightFenceRect: RectHitbox = {
            x: gapRight,
            y: fenceTop,
            w: Math.max(0, gameSize.width - gapRight),
            h: FENCE_HEIGHT,
          };

          const pigCircles = pigHitCircles(state.pigX, PIG_Y, PIG_SIZE);
          const hitLeft = leftFenceRect.w > 0 && pigCircles.some((c) => circleIntersectsRect(c, leftFenceRect));
          const hitRight = rightFenceRect.w > 0 && pigCircles.some((c) => circleIntersectsRect(c, rightFenceRect));

          if (hitLeft || hitRight) {
            state.isGameOver = true;
            state.crashActive = true;
            state.crashStartAt = timestamp;
            state.crashFinalOffsetY = 0;
            state.showGameOverMenu = false;
            setIsPaused(false);
            gameOverTriggered = true;
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
        triggerVibration("score");
      }

      if (gameOverTriggered) {
        state.impactFrames = 16;
        playPigHitSound();
        triggerVibration("impact");
        state.gameOverReadyAt = performance.now() + 4000;

        if (state.score > state.topScore) {
          state.topScore = state.score;
          state.isNewBest = true;
          try {
            localStorage.setItem("piggyFlyTopScore", state.topScore.toString());
          } catch (e) {
            console.error("Could not save top score", e);
          }
        } else {
          state.isNewBest = false;
        }
      }

      let shakeX = 0;
      if (state.impactFrames > 0) {
        shakeX = (Math.random() - 0.5) * 12;
        state.impactFrames -= 1;
      }

      const gameOverWaitMs = Math.max(0, state.gameOverReadyAt - performance.now());
      const canRestartFromGameOver = state.showGameOverMenu ? gameOverWaitMs <= 0 : false;

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
        crashRotation,
        crashOffsetY,
        showGameOverMenu: state.showGameOverMenu,
        isNewBest: state.isNewBest,
        canRestartFromGameOver,
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [playTone, playPigHitSound, triggerVibration, isPaused, countdown, hasStarted, isLandscape, gameSize.width, gameSize.height, PIG_Y]);

  return (
    <div className="w-screen h-screen bg-sky-300 overflow-hidden">
      <div
        className="relative border-4 border-amber-900 overflow-hidden w-screen h-screen"
        style={{ transform: `translateX(${renderState.shakeX}px)`, touchAction: "manipulation" }}
        onPointerDown={(e) => {
          if (showExitConfirm) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          handlePointerDown(e);
        }}
      >
        <FarmBackground gameWidth={gameSize.width} gameHeight={gameSize.height} />

        {isLandscape && (
          <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center text-center px-6">
            <div className="text-white font-black text-2xl">Rotate device to portrait 📱</div>
          </div>
        )}

        {!hasStarted && (
          <div className="absolute inset-0 z-50 bg-black/55 flex items-center justify-center">
            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-amber-500 text-black font-black text-xl shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                const state = gameStateRef.current;
                if (!state.hasSpawnedFirstFence && state.fences.length === 0) {
                  seedOpeningFence();
                }
                setHasStarted(true);
                startCountdown("resume");
              }}
            >
              Click to Start
            </button>
          </div>
        )}

        {renderState.showOnboarding && hasStarted && (
          <div className="absolute top-12 left-0 right-0 text-center z-30 pointer-events-none">
            <span className="text-[12px] md:text-sm font-bold text-white bg-black/45 px-3 py-1 rounded-full">
              Tap / Click / Space to change direction and avoid fences
            </span>
          </div>
        )}

        {!renderState.isGameOver && countdown === null && !isPaused && hasStarted && !isLandscape && (
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

        <Pig
          x={renderState.pigX}
          y={PIG_Y}
          direction={renderState.pigDirection}
          size={PIG_SIZE}
          crashRotation={renderState.crashRotation}
          crashOffsetY={renderState.crashOffsetY}
        />

        {renderState.fences.map((fence) => (
          <Fence key={fence.id} y={fence.y} gapStart={fence.gapStart} gapWidth={fence.gapWidth} gameWidth={gameSize.width} />
        ))}

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 text-5xl font-black leading-none select-none text-[#d7a14a] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
          {renderState.score}
        </div>

        <GameUI
          score={renderState.score}
          lastScore={renderState.lastScore}
          topScore={renderState.topScore}
          isGameOver={renderState.showGameOverMenu && countdown === null}
          isPaused={isPaused && countdown === null}
          isNewBest={renderState.isNewBest}
          canRestartFromGameOver={renderState.canRestartFromGameOver}
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          onToggleSound={() => setSoundEnabled((s) => !s)}
          onToggleVibration={() => setVibrationEnabled((v) => !v)}
          onResume={() => startCountdown("resume")}
          onRestart={() => startCountdown("restart")}
        />

        {countdown !== null && hasStarted && (
          <div className="absolute inset-0 z-50 bg-black/35 flex items-center justify-center pointer-events-none">
            <div
              className="text-white font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)] transition-all duration-700 ease-out"
              style={{
                fontSize: "128px",
                transform: `scale(${1 + (3 - Math.max(countdown, 1)) * 0.14})`,
                opacity: 0.95,
              }}
            >
              {countdown}
            </div>
          </div>
        )}

        {showExitConfirm && (
          <div
            className="absolute inset-0 z-[70] bg-black/70 flex items-center justify-center"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div
              className="bg-white p-6 rounded-xl w-72 border-4 border-amber-700 text-center"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="text-xl font-black text-amber-800 mb-4">Exit game?</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="bg-gray-200 font-bold py-2 rounded"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleExitNo}
                >
                  No
                </button>
                <button
                  className="bg-red-600 text-white font-bold py-2 rounded"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    CapacitorApp.exitApp();
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
