import Badge from "@/components/atoms/Badge";

const GradeIndicator = ({ grade, className }) => {
  const getGradeVariant = (grade) => {
    if (grade >= 90) return "success";
    if (grade >= 80) return "info";
    if (grade >= 70) return "warning";
    return "error";
  };

  const getGradeLetter = (grade) => {
    if (grade >= 97) return "A+";
    if (grade >= 93) return "A";
    if (grade >= 90) return "A-";
    if (grade >= 87) return "B+";
    if (grade >= 83) return "B";
    if (grade >= 80) return "B-";
    if (grade >= 77) return "C+";
    if (grade >= 73) return "C";
    if (grade >= 70) return "C-";
    if (grade >= 67) return "D+";
    if (grade >= 65) return "D";
    return "F";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getGradeVariant(grade)} className="font-bold">
        {grade.toFixed(1)}%
      </Badge>
      <span className="text-sm font-semibold text-slate-600">
        ({getGradeLetter(grade)})
      </span>
    </div>
  );
};

export default GradeIndicator;