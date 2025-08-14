import { motion } from "framer-motion";
import React from "react";
import ApperIcon from "@/components/ApperIcon";
import GradeIndicator from "@/components/molecules/GradeIndicator";
import Badge from "@/components/atoms/Badge";

const StudentTableRow = ({ student, onClick, isSelected, showCheckbox = false, isChecked = false, onToggle, enableDrag = false, onDragStart }) => {
  const getAttendanceVariant = (percentage) => {
    if (percentage >= 95) return "success";
    if (percentage >= 90) return "info";
    if (percentage >= 85) return "warning";
    return "error";
  };

  return (
<motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => !showCheckbox && onClick && onClick(student)}
      draggable={enableDrag}
      onDragStart={(e) => enableDrag && onDragStart && onDragStart(e, student)}
      className={`transition-all duration-200 ${
        enableDrag ? 'cursor-move' : 'cursor-pointer'
      } hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 ${
        isSelected ? "bg-gradient-to-r from-primary-100 to-accent-100" : "hover:shadow-md"
      } ${isChecked ? "bg-primary-50 border-l-4 border-primary-500" : ""}`}
    >
      {showCheckbox && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                e.stopPropagation();
                onToggle && onToggle();
              }}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          {enableDrag && (
            <div className="flex-shrink-0">
              <ApperIcon name="GripVertical" size={16} className="text-slate-400" />
            </div>
          )}
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-lg">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {student.firstName} {student.lastName}
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Grade {student.gradeLevel} • {student.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <GradeIndicator grade={student.gradeAverage} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Badge variant={student.recentAssignmentScore >= 80 ? "success" : student.recentAssignmentScore >= 70 ? "warning" : "error"}>
            {student.recentAssignmentScore}%
          </Badge>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getAttendanceVariant(student.attendancePercentage)}>
          {student.attendancePercentage.toFixed(1)}%
        </Badge>
      </td>
    </motion.tr>
  );
};

export default StudentTableRow;