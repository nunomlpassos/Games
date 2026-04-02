import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Play, RefreshCw, Home } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  type: "won" | "lost" | "paused";
  passedCount: number;
  target: number;
  failedCount: number;
  onNextLevel: () => void;
  onRestart: () => void;
  onResume: () => void;
  isLastLevel: boolean;
}

export function Modal({ 
  isOpen, 
  type, 
  passedCount, 
  target, 
  failedCount, 
  onNextLevel, 
  onRestart,
  onResume,
  isLastLevel 
}: ModalProps) {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case "won":
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nível Completado!</h2>
            <p className="text-gray-600 mb-6">
              Passou {passedCount}/{target} passageiros com {failedCount} falhas.
            </p>
            <div className="flex gap-3 w-full">
              {!isLastLevel ? (
                <Button onClick={onNextLevel} className="flex-1 bg-green-600 hover:bg-green-700">
                  Próximo Nível
                </Button>
              ) : (
                <Button onClick={onRestart} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Jogar Novamente
                </Button>
              )}
            </div>
          </>
        );

      case "lost":
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
            >
              <XCircle className="w-8 h-8 text-red-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fim de Jogo</h2>
            <p className="text-gray-600 mb-6">
              {failedCount >= 4 ? "Muitos passageiros perderam a paciência!" : "O tempo esgotou!"}
            </p>
            <div className="flex gap-3 w-full">
              <Button onClick={onRestart} variant="outline" className="flex-1">
                Tentar Novamente
              </Button>
              <Button onClick={onRestart} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Reiniciar Nível
              </Button>
            </div>
          </>
        );

      case "paused":
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
            >
              <Clock className="w-8 h-8 text-blue-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Jogo Pausado</h2>
            <p className="text-gray-600 mb-6">
              O tempo está parado. Podes retomar quando quiseres.
            </p>
            <div className="flex gap-3 w-full">
              <Button onClick={onResume} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" /> Retomar
              </Button>
              <Button onClick={onRestart} variant="outline" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" /> Reiniciar Nível
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}