import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);

  const biosLines = [
    "ASUSTek BIOS v2.04.1201",
    "Copyright (C) 2026, American Megatrends, Inc.",
    "Checking RAM: 32768MB OK",
    "Detecting Storage Devices...",
    "SATA6G_1: Samsung SSD 980 PRO 1TB",
    "Booting from Partition 0...",
    "Starting Windows 11..."
  ];

  useEffect(() => {
    if (stage === 0) {
      const timer = setTimeout(() => setStage(1), 3000);
      return () => clearTimeout(timer);
    } else if (stage === 1) {
      const timer = setTimeout(() => onComplete(), 4000);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[10000]">
      {stage === 0 && (
        <div className="bios-text self-start p-10 font-mono text-white">
          <AnimatePresence>
            {biosLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.3 }}
              >
                {`> ${line}`}
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-white ml-1"
          />
        </div>
      )}
      
      {stage === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Windows_11_logo.svg/2048px-Windows_11_logo.svg.png" 
            alt="Windows logo" 
            className="w-32 h-32 mb-8 object-contain"
          />
          <div className="relative w-12 h-12">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [1, 1.5, 1],
                  rotate: [0, 360],
                  x: [0, 20 * Math.cos(i * 45 * Math.PI / 180)],
                  y: [0, 20 * Math.sin(i * 45 * Math.PI / 180)],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BootSequence;
