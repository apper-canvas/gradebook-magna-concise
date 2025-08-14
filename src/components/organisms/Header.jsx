import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/atoms/Button";
import ClassSwitcher from "@/components/molecules/ClassSwitcher";
import ApperIcon from "@/components/ApperIcon";
const Header = ({ onMenuClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm lg:pl-64"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <ApperIcon name="Menu" className="h-5 w-5" />
          </Button>
<div>
            <h2 className="text-2xl font-bold gradient-text">Dashboard</h2>
            <p className="text-sm text-slate-600 font-medium">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <ClassSwitcher />
        </div>
        
<div className="hidden sm:flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-accent-50 px-4 py-2 rounded-lg border border-primary-200">
            <ApperIcon name="Clock" className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;