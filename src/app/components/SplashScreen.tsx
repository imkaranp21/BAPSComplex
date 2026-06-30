import { motion } from 'motion/react';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] flex flex-col items-center justify-center px-8"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center mb-32"
      >
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-3xl flex items-center justify-center mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="#1a1a1a" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="#1a1a1a" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="#1a1a1a" />
              <rect x="14" y="14" width="7" height="7" rx="1" fill="#1a1a1a" />
            </svg>
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-4">TimeSlot</h1>
        <p className="text-gray-400 text-lg">
          Sports Complex Booking
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onGetStarted}
        className="w-full max-w-sm bg-white text-black font-semibold py-4 px-8 rounded-2xl hover:bg-gray-200 transition-colors"
      >
        Get started
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-gray-500 text-sm mt-6"
      >
        Reserve spaces. Track availability.
      </motion.p>
    </motion.div>
  );
}
