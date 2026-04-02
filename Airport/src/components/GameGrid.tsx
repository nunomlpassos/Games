import { Passenger, PathTile, Obstacle } from "../types";
import { Passenger as PassengerComponent } from "./Passenger";
import { Gate } from "./Gate";
import { motion, AnimatePresence } from "framer-motion";

interface GameGridProps {
  id?: string;
  pathGrid: PathTile[][];
  passengers: Passenger[];
  waitingPassengers: Passenger[];
  obstacles: Obstacle[];
  draggingPassenger: Passenger | null;
  dragPosition: { x: number; y: number };
  onTogglePath: (row: number, col: number) => void;
  onDragStart: (passenger: Passenger, source: "waiting" | "grid", x: number, y: number) => void;
}

export function GameGrid({ 
  id,
  pathGrid, 
  passengers, 
  waitingPassengers,
  obstacles,
  draggingPassenger,
  dragPosition,
  onTogglePath, 
  onDragStart
}: GameGridProps) {
  const queueCols = [1, 3, 5, 7];

  return (
    <div className="relative">
      <div className="absolute -top-12 left-0 right-0 text-center text-sm text-gray-600 font-medium">
        <span className="text-blue-600 font-bold">Arrasta</span> as bolas para as filas • 
        <span className="text-red-600 font-bold"> Máx. 3 Obstáculos</span> (8s) • 
        <span className="text-orange-600 font-bold"> Clica</span> para bloquear caminhos
      </div>

      <div 
        id={id}
        className="relative bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200"
      >
        {/* Waiting queue row */}
        <div className="col-span-8 bg-blue-50 rounded-lg border-2 border-blue-200 p-3 mb-3">
          <div className="text-xs text-blue-600 font-semibold mb-2 text-center tracking-wide">FILA DE ESPERA</div>
          <div className="flex gap-3 justify-center min-h-[40px]">
            <AnimatePresence>
              {waitingPassengers.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onMouseDown={(e) => onDragStart(p, "waiting", e.clientX, e.clientY)}
                  onTouchStart={(e) => onDragStart(p, "waiting", e.touches[0].clientX, e.touches[0].clientY)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <PassengerComponent passenger={p} isDraggable />
                </motion.div>
              ))}
            </AnimatePresence>
            {waitingPassengers.length === 0 && (
              <div className="text-xs text-gray-400 self-center">Aguardando passageiros...</div>
            )}
          </div>
        </div>

        {/* Main game grid - REMOVED ROW 0 */}
        <div className="grid grid-cols-8 gap-1" style={{ width: '320px', height: '240px' }}>
          {pathGrid.slice(1).map((row, rowIndex) => { // Slice(1) removes the first row
            const actualRowIndex = rowIndex + 1;
            
            return row.map((tile, colIndex) => {
              const isGate = actualRowIndex === 6 && queueCols.includes(colIndex);
              const isQueue = queueCols.includes(colIndex);
              const isNonQueueCol = !queueCols.includes(colIndex);
              const obstacle = obstacles.find(o => o.row === actualRowIndex && o.col === colIndex);
              const isDropTarget = isQueue && draggingPassenger;
              
              return (
                <div
                  key={`${actualRowIndex}-${colIndex}`}
                  onClick={() => {
                    // Só permite clicar se for fila, não for gate, não tiver obstáculo e não for coluna não usada
                    if (isQueue && !isGate && !obstacle && !isNonQueueCol) {
                      onTogglePath(actualRowIndex, colIndex);
                    }
                  }}
                  className={`
                    relative rounded-lg transition-all duration-200
                    ${isGate ? 'bg-green-500' : ''}
                    ${obstacle ? 'bg-red-900 border-2 border-red-950' : ''}
                    
                    // Colunas não usadas (0, 2, 4, 6) - Desabilitadas permanentemente
                    ${isNonQueueCol && !isGate ? 'bg-gray-200 opacity-40 cursor-not-allowed border border-gray-300' : ''}
                    
                    // Colunas de fila (1, 3, 5, 7)
                    ${isQueue && !obstacle && !isNonQueueCol ? (
                      isDropTarget ? 'bg-yellow-100 border-2 border-yellow-400 scale-105' : 
                      !tile.active ? 'bg-gray-200 border-2 border-dashed border-gray-400 opacity-60' : // Inativo (bloqueado pelo jogador)
                      'bg-blue-50 border-2 border-blue-400 cursor-pointer hover:bg-blue-100' // Ativo
                    ) : ''}
                  `}
                  style={{ width: '38px', height: '38px' }}
                >
                  {isGate && <Gate col={colIndex} />}
                  
                  {obstacle && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold"
                    >
                      🚧
                    </motion.div>
                  )}
                  
                  {isQueue && !obstacle && !isNonQueueCol && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                      {queueCols.indexOf(colIndex) + 1}
                    </div>
                  )}
                  
                  {passengers
                    .filter(p => p.row === actualRowIndex && p.col === colIndex && p.id !== draggingPassenger?.id)
                    .map(p => (
                      <motion.div
                        key={p.id}
                        onMouseDown={(e) => onDragStart(p, "grid", e.clientX, e.clientY)}
                        onTouchStart={(e) => onDragStart(p, "grid", e.touches[0].clientX, e.touches[0].clientY)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <PassengerComponent passenger={p} isDraggable />
                      </motion.div>
                    ))}
                </div>
              );
            });
          })}
        </div>

        {/* Dragging ghost */}
        {draggingPassenger && (
          <div
            className="fixed pointer-events-none z-50"
            style={{ left: dragPosition.x - 12, top: dragPosition.y - 12 }}
          >
            <PassengerComponent passenger={draggingPassenger} isDraggable />
          </div>
        )}
      </div>
    </div>
  );
}