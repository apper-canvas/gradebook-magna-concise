import { motion } from "framer-motion";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const Empty = ({ 
  title = "No data found", 
  description = "There's nothing to show here yet.", 
  icon = "Inbox",
  actionLabel,
  onAction
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-full mb-6">
        <ApperIcon name={icon} className="h-16 w-16 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 font-medium mb-8 text-center max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          <ApperIcon name="Plus" className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default Empty;