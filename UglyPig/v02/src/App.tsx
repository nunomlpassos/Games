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
  });
  
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
  });

  const PIG_SIZE = 40;
  const FENCE_HEIGHT = 20;
  const PIG_Y = GAME_HEIGHT / 2 - PIG_SIZE / 2;

  // Load top score from localStorage on mount
  useEffect(() => {
    try {
      const savedTopScore = localStorage.getItem("piggyFlyTopScore");
      if (savedTopScore) {
        const parsedScore = parseInt(savedTopScore, 10);
        gameStateRef.current.topScore = parsedScore;
        setRenderState((prev) => ({ ...prev, topScore: parsedScore }));
      }
    } catch (e) {
      console.error("Could not load top score", e);
    }
  }, []);

  const toggleDirection = useCallback(() => {
    const state = gameStateRef.current;

    if (state.isGameOver) {
      // Save the score of the run that just finished as "Last Score"
      state.lastScore = state.score;
      
      // Reset game
      state.pigX = GAME_WIDTH / 2;
      state.pigDirection = 1;
      state.score = 0;
      state.fences = [];
      state.isGameOver = false;
      state.lastSpawnTime = 0;
      state.fenceId = 0;
    } else {
      state.pigDirection *= -1;
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleDirection();
      }
    };

    const handleClick = () => {
      toggleDirection();
    };

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("click", handleClick);
    };
  }, [toggleDirection]);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const state = gameStateRef.current;
      let gameOverTriggered = false;

      if (!state.isGameOver) {
        // Move pig
        state.pigX += state.pigDirection * PIG_SPEED_X;

        // Wall Collision
        if (state.pigX <= 0 || state.pigX + PIG_SIZE >= GAME_WIDTH) {
          state.isGameOver = true;
          gameOverTriggered = true;
        }

        // Spawn fences
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

        // Move fences
        state.fences = state.fences
          .map((fence) => ({
            ...fence,
            y: fence.y + FENCE_SPEED,
          }))
          .filter((fence) => fence.y < GAME_HEIGHT);

        // Collision Detection
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
          }
        });
      }

      // Handle High Score update immediately upon Game Over
      if (gameOverTriggered) {
        if (state.score > state.topScore) {
          state.topScore = state.score;
          try {
            localStorage.setItem("piggyFlyTopScore", state.topScore.toString());
          } catch (e) {
            console.error("Could not save top score", e);
          }
        }
      }

      setRenderState({
        pigX: state.pigX,
        pigDirection: state.pigDirection,
        score: state.score,
        lastScore: state.lastScore,
        topScore: state.topScore,
        fences: state.fences,
        isGameOver: state.isGameOver,
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-sky-300 flex items-center justify-center overflow-hidden">
      <div 
        className="relative border-4 border-amber-900 overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        <FarmBackground gameWidth={GAME_WIDTH} gameHeight={GAME_HEIGHT} />
        
        <Pig 
          x={renderState.pigX} 
          y={PIG_Y}
          direction={renderState.pigDirection}
        />
        
        {renderState.fences.map((fence) => (
          <Fence
            key={fence.id}
            y={fence.y}
            gapStart={fence.gapStart}
            gapWidth={fence.gapWidth}
            gameWidth={GAME_WIDTH}
          />
        ))}

        <GameUI
          score={renderState.score}
          lastScore={renderState.lastScore}
          topScore={renderState.topScore}
          isGameOver={renderState.isGameOver}
        />
      </div>

      {/* Bottom Counter - Fixed to viewport to ensure visibility above everything */}
      <div className="fixed bottom-4 left-4 w-12 h-12 bg-yellow-200 border-4 border-yellow-700 flex items-center justify-center z-50 shadow-lg">
        <span className="text-yellow-900 font-black text-xl leading-none">{renderState.score}</span>
      </div>
    </div>
  );
}