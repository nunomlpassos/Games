import { Passenger as PassengerType } from "../types";
import { motion } from "framer-motion";

interface PassengerProps {
  passenger: PassengerType;
  isDraggable?: boolean;
}

export function Passenger({ passenger, isDraggable = false }: PassengerProps) {
  const patiencePercent = passenger.patience / passenger.maxPatience;
  
  let colorClass = "bg-blue-500";
  if (patiencePercent < 0.3) {
    colorClass = "bg-red-500";
  } else if (patiencePercent < 0.6) {
    colorClass = "bg-orange-500";
  }

  return (
    <motion.div
      className={`
        rounded-full shadow-md relative
        ${colorClass}
        ${patiencePercent < 0.3 ? 'animate-pulse' : ''}
        ${isDraggable ? 'hover:scale-110 transition-transform' : ''}
      `}
      style={{
        width: '24px',
        height: '24px',
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <svg
        className="absolute -top-1 -left-1 w-7 h-7 transform -rotate-90"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={patiencePercent < 0.3 ? "#ef4444" : patiencePercent < 0.6 ? "#f97316" : "#3b82f6"}
          strokeWidth="2.5"
          strokeDasharray={`${patiencePercent * 62.8} 62.8`}
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}