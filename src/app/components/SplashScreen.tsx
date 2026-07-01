import { motion } from 'motion/react';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-orange-600 to-orange-800 flex flex-col items-center justify-center px-8"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="#EA580C" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="#EA580C" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="#EA580C" />
              <rect x="14" y="14" width="7" height="7" rx="1" fill="#EA580C" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Yogi Sports Complex</h1>
        <p className="text-orange-200 text-sm mt-1">Nakuru, Kenya</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={onGetStarted}
          className="w-full bg-white text-orange-600 font-semibold py-4 px-8 rounded-2xl hover:bg-orange-50 transition-colors shadow-md"
        >
          Get Started
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-orange-200 text-sm mt-8"
      >
        Reserve spaces. Track availability.
      </motion.p>
    </motion.div>
  );
}
