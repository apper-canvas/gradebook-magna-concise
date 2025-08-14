import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { classService } from "@/services/api/classService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Button from "@/components/atoms/Button";

const ClassSwitcher = () => {
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const [allClasses, currentActive] = await Promise.all([
        classService.getAll(),
        classService.getActive()
      ]);
      setClasses(allClasses);
      setActiveClass(currentActive);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSwitch = async (classId) => {
    try {
      const newActiveClass = await classService.setActive(classId);
      setActiveClass(newActiveClass);
      setIsOpen(false);
toast.success(`Switched to ${newActiveClass.name}`);
      
      // Trigger page refresh for other components
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new CustomEvent('classChanged', { 
          detail: { classId: newActiveClass.Id } 
        }));
      }
    } catch (error) {
      toast.error('Failed to switch class');
    }
  };

  if (loading || !activeClass) {
    return (
      <div className="flex items-center space-x-2 bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 rounded-lg border border-slate-200">
        <ApperIcon name="BookOpen" className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-accent-50 px-3 py-2 rounded-lg border border-primary-200 hover:from-primary-100 hover:to-accent-100"
      >
        <ApperIcon name="BookOpen" className="h-4 w-4 text-primary-600" />
        <span className="text-sm font-semibold text-primary-700 hidden sm:inline">
          {activeClass.name}
        </span>
        <span className="text-xs text-primary-600 hidden md:inline">
          ({activeClass.enrolledCount} students)
        </span>
        <ApperIcon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          className="h-3 w-3 text-primary-600" 
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-20"
            >
              <div className="p-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1">
                  Switch Class
                </div>
                {classes.map((classItem) => (
                  <button
                    key={classItem.Id}
                    onClick={() => handleClassSwitch(classItem.Id)}
                    className={`w-full text-left px-2 py-2 rounded hover:bg-slate-50 flex items-center justify-between ${
                      classItem.isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{classItem.name}</div>
                      <div className="text-xs text-slate-500">
                        {classItem.period} • {classItem.room}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500">
                        {classItem.enrolledCount}
                      </span>
                      {classItem.isActive && (
                        <ApperIcon name="Check" className="h-3 w-3 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassSwitcher;