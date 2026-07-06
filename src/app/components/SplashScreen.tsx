import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(234,88,12,0.08)_0%,_transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* BAPS Logo — inverted to white for dark bg */}
        <motion.img
          src="/baps-logo.png"
          alt="BAPS"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-24 h-24 object-contain mb-10"
          style={{ filter: 'brightness(0) invert(1)' }}
        />

        <div className="text-center leading-none mb-3">
          <h1 className="text-[54px] md:text-7xl font-black text-white tracking-tighter">YOGI</h1>
          <h1 className="text-[54px] md:text-7xl font-black text-white tracking-tighter">SPORTS</h1>
          <h1 className="text-[54px] md:text-7xl font-black text-orange-500 tracking-tighter">COMPLEX</h1>
        </div>

        <p className="text-zinc-600 text-[10px] tracking-[0.32em] uppercase font-semibold mt-5 mb-14">
          Nakuru · Kenya
        </p>

        <div className="w-10 h-px bg-zinc-800 mb-14" />

        <motion.button
          onClick={onGetStarted}
          whileTap={{ scale: 0.97 }}
          className="group flex items-center gap-3 border border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 text-zinc-400 hover:text-white px-10 py-4 text-[11px] font-bold tracking-[0.22em] uppercase transition-all duration-300"
        >
          Enter
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-zinc-800 text-[9px] tracking-[0.3em] uppercase"
      >
        BAPS Swaminarayan Sanstha
      </motion.p>
    </div>
  );
}
