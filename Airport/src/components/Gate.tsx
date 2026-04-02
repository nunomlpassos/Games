import { motion } from "framer-motion";

interface GateProps {
  col: number;
}

export function Gate({ col }: GateProps) {
  const gateLabels = ["A", "B", "C", "D"];
  const labelIndex = Math.floor(col / 2);
  
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold"
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-xs">{gateLabels[labelIndex]}</span>
      <span className="text-lg">✈</span>
    </motion.div>
  );
}