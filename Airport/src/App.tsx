import { useState, useEffect, useCallback, useRef } from "react";
import { GameGrid } from "./components/GameGrid";
import { StatusBar } from "./components/UI/StatusBar";
import { Modal } from "./components/UI/Modal";
import { levels } from "./utils/levelData";
import { Passenger, PathTile, Obstacle } from "./types";

// Constante fora do componente para evitar re-renderizações desnecessárias
const QUEUE_COLS = [1, 3, 5, 7];

export default function App() {
  // Estado actualizado para incluir "paused"
  const [gameState, setGameState] = useState<"playing" | "paused" | "won" | "lost">("playing");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levels[0].timeLimit);
  const [passedCount, setPassedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [waitingPassengers, setWaitingPassengers] = useState<Passenger[]>([]);
  const [pathGrid, setPathGrid] = useState<PathTile[][]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  // Drag & Drop State
  const [draggingPassenger, setDraggingPassenger] = useState<Passenger | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragSourceRef = useRef<"waiting" | "grid" | null>(null);

  // Refs para evitar reiniciar intervalos
  const pathGridRef = useRef(pathGrid);
  const obstaclesRef = useRef(obstacles);
  const passengersRef = useRef(passengers);
  const waitingPassengersRef = useRef(waitingPassengers);
  const draggingPassengerRef = useRef(draggingPassenger);

  // Sincronizar refs com state
  useEffect(() => { pathGridRef.current = pathGrid; }, [pathGrid]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { passengersRef.current = passengers; }, [passengers]);
  useEffect(() => { waitingPassengersRef.current = waitingPassengers; }, [waitingPassengers]);
  useEffect(() => { draggingPassengerRef.current = draggingPassenger; }, [draggingPassenger]);

  const level = levels[currentLevel];

  // Função para Pausar/Retomar
  const togglePause = useCallback(() => {
    setGameState(prev => prev === "playing" ? "paused" : "playing");
  }, []);

  // Initialize path grid
  useEffect(() => {
    const grid: PathTile[][] = [];
    for (let row = 0; row < 7; row++) {
      grid[row] = [];
      for (let col = 0; col < 8; col++) {
        grid[row][col] = {
          row,
          col,
          active: true,
          connections: { up: false, down: false, left: false, right: false }
        };
      }
    }
    setPathGrid(grid);
  }, [currentLevel]);

  // Dynamic Obstacle Spawner
  useEffect(() => {
    if (gameState !== "playing") return;

    const spawnInterval = setInterval(() => {
      const currentObstacles = obstaclesRef.current;
      const currentPassengers = passengersRef.current;
      
      if (currentObstacles.length >= 3) return;
      
      for (let attempt = 0; attempt < 10; attempt++) {
        const row = Math.floor(Math.random() * 5) + 1; 
        const col = QUEUE_COLS[Math.floor(Math.random() * QUEUE_COLS.length)];
        
        const hasObstacle = currentObstacles.some(o => o.row === row && o.col === col);
        const hasPassenger = currentPassengers.some(p => p.row === row && p.col === col);
        
        if (!hasObstacle && !hasPassenger) {
          const newObstacle: Obstacle = {
            id: Date.now() + Math.random(),
            row,
            col,
            type: "block",
            duration: 8000
          };

          setObstacles(prev => [...prev, newObstacle]);

          setTimeout(() => {
            setObstacles(prev => prev.filter(o => o.id !== newObstacle.id));
          }, newObstacle.duration);
          
          break;
        }
      }
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [gameState]);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Spawn passengers in waiting queue
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const timer = setInterval(() => {
      setWaitingPassengers(prev => {
        if (prev.length < 5) {
          const newPassenger: Passenger = {
            id: Date.now() + Math.random(),
            row: 0,
            col: 0,
            patience: level.patienceTime,
            maxPatience: level.patienceTime,
            path: [],
            targetCol: 0
          };
          return [...prev, newPassenger];
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [gameState, level]);

  // Update waiting passengers patience
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      const dragging = draggingPassengerRef.current;
      
      setWaitingPassengers(prev => {
        return prev.map(p => {
          if (dragging?.id === p.id) return p;
          
          const newPatience = Math.max(0, p.patience - 0.15);
          
          if (newPatience <= 0) {
            setFailedCount(f => {
              if (f + 1 >= 4) {
                setGameState("lost");
              }
              return f + 1;
            });
            return null;
          }
          return { ...p, patience: newPatience };
        }).filter((p): p is Passenger => p !== null);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [gameState]);

  // Move assigned passengers
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      const currentPathGrid = pathGridRef.current;
      const currentObstacles = obstaclesRef.current;
      const dragging = draggingPassengerRef.current;

      setPassengers(prev => {
        return prev.map(p => {
          if (dragging?.id === p.id) return p;

          const newPatience = Math.max(0, p.patience - 0.1);
          
          if (newPatience <= 0) {
            setFailedCount(f => {
              if (f + 1 >= 4) {
                setGameState("lost");
              }
              return f + 1;
            });
            return null;
          }

          const isBlocked = currentObstacles.some(o => o.row === p.row && o.col === p.col);
          if (isBlocked) return { ...p, patience: newPatience };

          let newRow = p.row;
          let newCol = p.col;

          if (p.col !== p.targetCol) {
            const direction = p.targetCol > p.col ? 1 : -1;
            const nextCol = p.col + direction;
            const nextBlocked = currentObstacles.some(o => o.row === p.row && o.col === nextCol);
            if (!nextBlocked && currentPathGrid[p.row]?.[nextCol]?.active) {
              newCol = nextCol;
            }
          } else {
            if (p.row < 6) {
              const nextRow = p.row + 1;
              const nextBlocked = currentObstacles.some(o => o.row === nextRow && o.col === p.col);
              if (!nextBlocked && currentPathGrid[nextRow]?.[p.col]?.active) {
                newRow = nextRow;
              }
            }
          }

          if (newRow === 6) {
            setPassedCount(pc => {
              if (pc + 1 >= level.target) {
                setGameState("won");
              }
              return pc + 1;
            });
            return null;
          }

          return { ...p, row: newRow, col: newCol, patience: newPatience };
        }).filter((p): p is Passenger => p !== null);
      });
    }, 300);

    return () => clearInterval(timer);
  }, [gameState, level]);

  // Drag Handlers
  const handleDragStart = useCallback((passenger: Passenger, source: "waiting" | "grid", clientX: number, clientY: number) => {
    // Impede arrastar se estiver pausado
    if (gameState !== "playing") return;
    
    setDraggingPassenger(passenger);
    setDragPosition({ x: clientX, y: clientY });
    dragSourceRef.current = source;
  }, [gameState]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (draggingPassenger && gameState === "playing") {
      setDragPosition({ x: clientX, y: clientY });
    }
  }, [draggingPassenger, gameState]);

  const handleDragEnd = useCallback((clientX: number, clientY: number) => {
    if (!draggingPassenger || gameState !== "playing") return;

    const gridElement = document.getElementById("game-grid");
    if (gridElement) {
      const rect = gridElement.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      const cellWidth = rect.width / 8;
      const cellHeight = rect.height / 7;
      
      const col = Math.floor(relativeX / cellWidth);
      const row = Math.floor(relativeY / cellHeight);

      if (row >= 1 && row <= 5 && QUEUE_COLS.includes(col)) {
        if (dragSourceRef.current === "waiting") {
          setWaitingPassengers(prev => prev.filter(p => p.id !== draggingPassenger.id));
          setPassengers(prev => [...prev, {
            ...draggingPassenger,
            row: 1,
            col: 0,
            targetCol: col
          }]);
        } else if (dragSourceRef.current === "grid") {
          setPassengers(prev => prev.map(p => 
            p.id === draggingPassenger.id ? { ...p, targetCol: col } : p
          ));
        }
      }
    }

    setDraggingPassenger(null);
    dragSourceRef.current = null;
  }, [draggingPassenger, gameState]);

  // Global mouse/touch events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => handleDragEnd(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchEnd = (e: TouchEvent) => handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const togglePath = useCallback((row: number, col: number) => {
    if (gameState !== "playing") return; // Impede editar caminhos pausado
    if (obstacles.some(o => o.row === row && o.col === col)) return;
    if (row === 0 || row === 6) return;
    
    setPathGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col].active = !newGrid[row][col].active;
      return newGrid;
    });
  }, [obstacles, gameState]);

  const resetLevel = useCallback(() => {
    setGameState("playing");
    setTimeLeft(level.timeLimit);
    setPassedCount(0);
    setFailedCount(0);
    setPassengers([]);
    setWaitingPassengers([]);
    setObstacles([]);
    setDraggingPassenger(null);
  }, [level]);

  const nextLevel = useCallback(() => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(prev => prev + 1);
      resetLevel();
    }
  }, [currentLevel, resetLevel]);

  const restartGame = useCallback(() => {
    setCurrentLevel(0);
    resetLevel();
  }, [resetLevel]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 select-none">
      <StatusBar
        timeLeft={timeLeft}
        passedCount={passedCount}
        target={level.target}
        failedCount={failedCount}
        level={currentLevel + 1}
        onPause={togglePause}
        isPaused={gameState === "paused"}
      />
      
      <GameGrid
        id="game-grid"
        pathGrid={pathGrid}
        passengers={passengers}
        waitingPassengers={waitingPassengers}
        obstacles={obstacles}
        draggingPassenger={draggingPassenger}
        dragPosition={dragPosition}
        onTogglePath={togglePath}
        onDragStart={handleDragStart}
      />

      <Modal
        isOpen={gameState !== "playing"}
        type={gameState}
        passedCount={passedCount}
        target={level.target}
        failedCount={failedCount}
        onNextLevel={nextLevel}
        onRestart={resetLevel} // Reinicia o nível atual
        onResume={togglePause} // Nova prop para retomar
        isLastLevel={currentLevel === levels.length - 1}
      />
    </div>
  );
}