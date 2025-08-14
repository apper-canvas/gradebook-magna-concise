import { motion } from "framer-motion";
import GradeIndicator from "@/components/molecules/GradeIndicator";
import Badge from "@/components/atoms/Badge";

const StudentTableRow = ({ student, onClick, isSelected }) => {
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
      onClick={() => onClick(student)}
      className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 ${
        isSelected ? "bg-gradient-to-r from-primary-100 to-accent-100" : "hover:shadow-md"
      }`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
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