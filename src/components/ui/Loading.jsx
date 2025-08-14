import { motion } from "framer-motion";

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mb-4"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 w-full max-w-4xl"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg w-3/4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg"></div>
            <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg"></div>
            <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg"></div>
          </div>
        </div>
      </motion.div>
      <p className="text-slate-600 font-medium mt-4">{message}</p>
    </div>
  );
};

export default Loading;