import { motion } from "framer-motion";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const Error = ({ message = "Something went wrong", onRetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="bg-gradient-to-br from-error-100 to-error-200 p-4 rounded-full mb-6">
        <ApperIcon name="AlertCircle" className="h-12 w-12 text-error-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h3>
      <p className="text-slate-600 font-medium mb-6 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="error" className="gap-2">
          <ApperIcon name="RefreshCw" className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
};

export default Error;