import { useState } from "react";
import { motion } from "framer-motion";
import StudentTableRow from "@/components/molecules/StudentTableRow";
import ApperIcon from "@/components/ApperIcon";

const StudentTable = ({ students, onStudentSelect, selectedStudent, showCheckboxes = false, selectedStudents = new Set(), onStudentToggle, onSelectAll, enableDrag = false, onDragStart }) => {
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === "name") {
      aValue = `${a.lastName}, ${a.firstName}`;
      bValue = `${b.lastName}, ${b.firstName}`;
    }
    
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const SortableHeader = ({ field, children, className }) => (
    <th
      className={`px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-2">
        <span>{children}</span>
        <ApperIcon
          name={
            sortField === field
              ? sortDirection === "asc"
                ? "ChevronUp"
                : "ChevronDown"
              : "ChevronsUpDown"
          }
          className="h-4 w-4"
        />
      </div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-200"
    >
      <div className="overflow-x-auto">
<table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              {showCheckboxes && (
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === students.length && students.length > 0}
                    onChange={onSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </th>
              )}
              <SortableHeader field="name">Student</SortableHeader>
              <SortableHeader field="gradeAverage">Grade Average</SortableHeader>
              <SortableHeader field="recentAssignmentScore">Recent Assignment</SortableHeader>
              <SortableHeader field="attendancePercentage">Attendance</SortableHeader>
            </tr>
          </thead>
<tbody className="bg-white divide-y divide-slate-200">
{sortedStudents.map((student) => (
              <StudentTableRow
                key={student.Id}
                student={student}
                onClick={onStudentSelect}
                isSelected={selectedStudent?.Id === student.Id}
                showCheckbox={showCheckboxes}
                isChecked={selectedStudents.has(student.Id)}
                onToggle={() => onStudentToggle && onStudentToggle(student.Id)}
                enableDrag={enableDrag}
                onDragStart={onDragStart}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default StudentTable;