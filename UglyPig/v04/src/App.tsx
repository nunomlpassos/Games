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

  // Load preferences + top score from localStorage on mount
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

  const toggleDirection = useCallback(() => {
    const state = gameStateRef.current;

    if (state.showOnboarding) {
      state.showOnboarding = false;
    }

    if (state.isGameOver) {
      state.lastScore = state.score;
      state.pigX = GAME_WIDTH / 2;
      state.pigDirection = 1;
      state.score = 0;
      state.fences = [];
      state.isGameOver = false;
      state.lastSpawnTime = 0;
      state.fenceId = 0;
      state.impactFrames = 0;
    } else {
      state.pigDirection *= -1;
      playTone(620, 0.05, "triangle");
    }
  }, [playTone]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleDirection();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleDirection]);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const state = gameStateRef.current;
      let gameOverTriggered = false;
      let scoreTriggered = false;

      if (!state.isGameOver) {
        state.pigX += state.pigDirection * PIG_SPEED_X;

        if (state.pigX <= 0 || state.pigX + PIG_SIZE >= GAME_WIDTH) {
          state.isGameOver = true;
          gameOverTriggered = true;
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
  }, [playTone, vibrationEnabled]);

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

          {/* Sound/Vibration controls */}
          <div className="absolute top-10 right-2 z-30 flex flex-col gap-1 text-[11px]">
            <button
              type="button"
              className={`px-2 py-1 rounded font-bold border ${soundEnabled ? "bg-emerald-500/85 text-white border-emerald-700" : "bg-gray-700/80 text-gray-200 border-gray-500"}`}
              onClick={(e) => {
                e.stopPropagation();
                setSoundEnabled((s) => !s);
              }}
            >
              Sound: {soundEnabled ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded font-bold border ${vibrationEnabled ? "bg-cyan-500/85 text-white border-cyan-700" : "bg-gray-700/80 text-gray-200 border-gray-500"}`}
              onClick={(e) => {
                e.stopPropagation();
                setVibrationEnabled((v) => !v);
              }}
            >
              Vibration: {vibrationEnabled ? "ON" : "OFF"}
            </button>
          </div>

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

          {/* Score inside game area, bottom-centered, number only */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 text-5xl font-black leading-none select-none text-[#d7a14a] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
            {renderState.score}
          </div>

          <GameUI
            score={renderState.score}
            lastScore={renderState.lastScore}
            topScore={renderState.topScore}
            isGameOver={renderState.isGameOver}
          />
        </div>
      </div>
    </div>
  );
}
