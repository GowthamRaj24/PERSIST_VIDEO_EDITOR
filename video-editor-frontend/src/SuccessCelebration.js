import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

const SuccessCelebration = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <Confetti />
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-gray-800 rounded-xl p-8 max-w-lg w-full mx-4 text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Video Generated Successfully!</h2>
        <p className="text-gray-300 mb-6">Your video is ready to download</p>
        <div className="space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white"
          >
            Download Video
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuccessCelebration;
