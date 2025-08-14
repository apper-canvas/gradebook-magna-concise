import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";

const Sidebar = ({ isOpen, onClose }) => {
  const navigationItems = [
    { name: "Students", path: "/students", icon: "Users" },
    { name: "Classes", path: "/classes", icon: "BookOpen" },
    { name: "Reports", path: "/reports", icon: "BarChart3" },
    { name: "Settings", path: "/settings", icon: "Settings" }
  ];

  // Desktop Sidebar (static)
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
      <div className="flex flex-col flex-grow bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 overflow-y-auto border-r border-primary-700 shadow-2xl">
        <div className="flex items-center flex-shrink-0 px-6 py-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-accent-400 to-accent-600 p-2 rounded-xl shadow-lg">
              <ApperIcon name="GraduationCap" className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GradeBook Pro</h1>
              <p className="text-primary-200 text-sm font-medium">Student Management</p>
            </div>
          </div>
        </div>
        <nav className="mt-8 flex-1 px-4 pb-4 space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg transform scale-105"
                    : "text-primary-200 hover:bg-primary-700/50 hover:text-white hover:scale-105"
                }`
              }
            >
              <ApperIcon
                name={item.icon}
                className="mr-4 h-5 w-5 transition-transform duration-200 group-hover:scale-110"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );

  // Mobile Sidebar (overlay with transforms)
  const MobileSidebar = () => (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 shadow-2xl"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between flex-shrink-0 px-6 py-8">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-accent-400 to-accent-600 p-2 rounded-xl shadow-lg">
                <ApperIcon name="GraduationCap" className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GradeBook Pro</h1>
                <p className="text-primary-200 text-sm font-medium">Student Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-primary-200 hover:text-white transition-colors p-1"
            >
              <ApperIcon name="X" className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 flex-1 px-4 pb-4 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg transform scale-105"
                      : "text-primary-200 hover:bg-primary-700/50 hover:text-white hover:scale-105"
                  }`
                }
              >
                <ApperIcon
                  name={item.icon}
                  className="mr-4 h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.div>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;