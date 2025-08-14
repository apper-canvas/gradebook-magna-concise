import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { studentService } from "@/services/api/studentService";
import { classService } from "@/services/api/classService";
import ApperIcon from "@/components/ApperIcon";
import StudentTable from "@/components/organisms/StudentTable";
import StudentDetailPanel from "@/components/organisms/StudentDetailPanel";
import SearchBar from "@/components/molecules/SearchBar";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Label from "@/components/atoms/Label";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import studentsData from "@/services/mockData/students_updated.json";
import classesData from "@/services/mockData/classes.json";

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("roster");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  
  // Bulk grade entry state
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkGradeData, setBulkGradeData] = useState({
    assignmentName: "",
    maxScore: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Assignment"
  });
  const [studentGrades, setStudentGrades] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);

  // Class assignment state
  const [availableClasses, setAvailableClasses] = useState([]);
  const [dragOverClass, setDragOverClass] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  
const loadStudents = async (classId = null) => {
    try {
      setLoading(true);
      setError(null);
      const currentClass = classId || await classService.getActive();
      setActiveClass(currentClass);
      const data = await studentService.getAll(currentClass?.Id);
      setStudents(data);
      setFilteredStudents(data);
    } catch (err) {
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
};

  // Load attendance data when date changes
  useEffect(() => {
    if (viewMode === "attendance" && students.length > 0) {
      loadAttendanceForDate();
    }
  }, [selectedDate, viewMode, students]);

  useEffect(() => {
    if (viewMode === "assignment") {
      loadAvailableClasses();
    }
  }, [viewMode]);

  const loadAvailableClasses = async () => {
    try {
      const classes = await classService.getAll();
      setAvailableClasses(classes);
    } catch (error) {
      console.error("Failed to load classes:", error);
      toast.error("Failed to load available classes");
    }
  };

  async function loadAttendanceForDate() {
    setAttendanceLoading(true);
    try {
      const attendanceData = await studentService.getAttendanceForDate(selectedDate);
      setAttendance(attendanceData);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setAttendance({});
    } finally {
      setAttendanceLoading(false);
    }
  }

  async function handleAttendanceChange(studentId, newStatus) {
    try {
      await studentService.updateStudentAttendance(studentId, selectedDate, newStatus);
      
      // Update local attendance state
      setAttendance(prev => ({
        ...prev,
        [studentId]: newStatus
      }));

      // Update student attendance percentages
      const updatedStudents = await studentService.getAll();
      setStudents(updatedStudents);
      
      // Update filtered students if search is active
      const filtered = updatedStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);

      toast.success(`Attendance updated for ${updatedStudents.find(s => s.Id === studentId)?.name}`);
    } catch (err) {
      console.error("Failed to update attendance:", err);
      toast.error("Failed to update attendance");
    }
  }

  function getNextStatus(currentStatus) {
    const statuses = ["Present", "Absent", "Late", "Excused"];
    const currentIndex = statuses.indexOf(currentStatus || "Absent");
    return statuses[(currentIndex + 1) % statuses.length];
  }

  function getStatusVariant(status) {
    switch (status) {
      case "Present": return "success";
      case "Absent": return "destructive";
      case "Late": return "warning";
      case "Excused": return "secondary";
      default: return "outline";
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case "Present": return "CheckCircle";
      case "Absent": return "XCircle";
      case "Late": return "Clock";
      case "Excused": return "Shield";
      default: return "Minus";
    }
  }
useEffect(() => {
    loadStudents();

    // Listen for class changes from ClassSwitcher
    const handleClassChange = (event) => {
      const { classId } = event.detail;
      loadStudents({ Id: classId });
      // Reset selections when class changes
      setSelectedStudents(new Set());
      setSelectedStudent(null);
      setStudentGrades({});
    };

    window.addEventListener('classChanged', handleClassChange);

    return () => {
      window.removeEventListener('classChanged', handleClassChange);
    };
  }, []);
  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleCloseDetail = () => {
    setSelectedStudent(null);
  };

  const handleGradeAdd = async (studentId, gradeData) => {
    try {
      const updatedStudent = await studentService.addGrade(studentId, gradeData);
      setStudents(prev => prev.map(s => s.Id === studentId ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
    } catch (err) {
      console.error("Failed to add grade:", err);
    }
};

  const handleStudentToggle = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
      const newGrades = { ...studentGrades };
      delete newGrades[studentId];
      setStudentGrades(newGrades);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
      setStudentGrades({});
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.Id)));
    }
  };

  const handleBulkGradeChange = (field, value) => {
    setBulkGradeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentGradeChange = (studentId, score) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: score
    }));
};

  // Quick grade entry functions
  const handleQuickGrade = (studentId, gradeType) => {
    if (!bulkGradeData.maxScore) {
      toast.error("Please set max score first");
      return;
    }

    const maxScore = parseFloat(bulkGradeData.maxScore);
    let score = 0;

    switch (gradeType) {
      case 'A':
        score = maxScore * 0.9; // 90%
        break;
      case 'B':
        score = maxScore * 0.8; // 80%
        break;
      case 'C':
        score = maxScore * 0.7; // 70%
        break;
      case 'D':
        score = maxScore * 0.6; // 60%
        break;
      case 'F':
        score = 0; // 0%
        break;
      case 'Full':
        score = maxScore; // 100%
        break;
      case 'Incomplete':
        score = 0; // 0%
        break;
      default:
        return;
    }

    setStudentGrades(prev => ({
      ...prev,
      [studentId]: score.toString()
    }));

    toast.success(`${gradeType} grade (${score}/${maxScore}) applied`);
  };

  const handleBulkQuickGrade = (gradeType) => {
    if (!bulkGradeData.maxScore) {
      toast.error("Please set max score first");
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error("Please select students first");
      return;
    }

    const maxScore = parseFloat(bulkGradeData.maxScore);
    let score = 0;

    switch (gradeType) {
      case 'A':
        score = maxScore * 0.9;
        break;
      case 'B':
        score = maxScore * 0.8;
        break;
      case 'C':
        score = maxScore * 0.7;
        break;
      case 'D':
        score = maxScore * 0.6;
        break;
      case 'F':
        score = 0;
        break;
      case 'Full':
        score = maxScore;
        break;
      case 'Incomplete':
        score = 0;
        break;
      default:
        return;
    }

    const newGrades = { ...studentGrades };
    selectedStudents.forEach(studentId => {
      newGrades[studentId] = score.toString();
    });

    setStudentGrades(newGrades);
    toast.success(`${gradeType} grade applied to ${selectedStudents.size} students`);
  };
const handleBulkGradeSubmit = async () => {
    if (!bulkGradeData.assignmentName.trim()) {
      toast.error("Assignment name is required");
      return;
    }

    if (!bulkGradeData.maxScore || bulkGradeData.maxScore <= 0) {
      toast.error("Max score must be greater than 0");
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    // Validate that all selected students have scores
    const missingScores = Array.from(selectedStudents).filter(
      studentId => !studentGrades[studentId] || studentGrades[studentId] === ""
    );

    if (missingScores.length > 0) {
      const studentNames = missingScores.map(id => {
        const student = students.find(s => s.Id === id);
        return `${student?.firstName} ${student?.lastName}`;
      }).join(", ");
      toast.error(`Please enter scores for: ${studentNames}`);
      return;
    }

    setBulkLoading(true);
    
    try {
      const gradesArray = Array.from(selectedStudents).map(studentId => ({
        studentId,
        ...bulkGradeData,
        score: parseFloat(studentGrades[studentId]),
        maxScore: parseFloat(bulkGradeData.maxScore)
      }));

      await studentService.addBulkGrades(gradesArray);
      
      // Refresh students data
      await loadStudents();
      
      // Reset form
      setSelectedStudents(new Set());
      setStudentGrades({});
      setBulkGradeData({
        assignmentName: "",
        maxScore: "",
        date: format(new Date(), "yyyy-MM-dd"),
        category: "Assignment"
      });
      
      toast.success(`Grades added for ${selectedStudents.size} students`);
    } catch (error) {
      toast.error("Failed to add grades: " + error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Class assignment handlers
  const handleStudentDragStart = (e, student) => {
    e.dataTransfer.setData("application/json", JSON.stringify(student));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClassDragOver = (e, classId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverClass(classId);
  };

  const handleClassDragLeave = (e) => {
    e.preventDefault();
    setDragOverClass(null);
  };

  const handleClassDrop = async (e, targetClass) => {
    e.preventDefault();
    setDragOverClass(null);
    
    try {
      const studentData = JSON.parse(e.dataTransfer.getData("application/json"));
      await handleAssignStudentsToClass([studentData.Id], targetClass.Id);
    } catch (error) {
      console.error("Drop error:", error);
      toast.error("Failed to assign student to class");
    }
  };

  const handleBulkAssignToClass = async (classId) => {
    if (selectedStudents.size === 0) {
      toast.error("Please select students first");
      return;
    }

    const targetClass = availableClasses.find(c => c.Id === classId);
    if (!targetClass) {
      toast.error("Class not found");
      return;
    }

    await handleAssignStudentsToClass(Array.from(selectedStudents), classId);
  };

  const handleAssignStudentsToClass = async (studentIds, classId) => {
    setAssignmentLoading(true);
    
    try {
      await studentService.assignStudentsToClass(studentIds, classId);
      
      const targetClass = availableClasses.find(c => c.Id === classId);
      const studentCount = studentIds.length;
      const studentText = studentCount === 1 ? "student" : "students";
      
      toast.success(`${studentCount} ${studentText} assigned to ${targetClass?.name}`);
      
      // Reset selection
      setSelectedStudents(new Set());
      
      // Refresh students data
      await loadStudents();
    } catch (error) {
      toast.error("Failed to assign students to class: " + error.message);
    } finally {
      setAssignmentLoading(false);
    }
  };
  function renderAttendanceView() {
    if (attendanceLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <Card className="p-12">
          <Empty 
            message="No students found"
            description="Try adjusting your search terms"
          />
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Student</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">ID</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const currentStatus = attendance[student.Id] || "Absent";
                  return (
                    <motion.tr
                      key={student.Id}
                      className="border-b hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-muted-foreground">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant={getStatusVariant(currentStatus)}
                          size="sm"
                          onClick={() => handleAttendanceChange(student.Id, getNextStatus(currentStatus))}
                          className="gap-2"
                        >
                          <ApperIcon name={getStatusIcon(currentStatus)} size={16} />
                          {currentStatus}
                        </Button>
                      </td>
                      <td className="p-4 text-center">
                        <Badge 
                          variant={student.attendancePercentage >= 90 ? "success" : student.attendancePercentage >= 75 ? "warning" : "destructive"}
                        >
                          {student.attendancePercentage.toFixed(1)}%
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

const getClassStats = () => {
    if (students.length === 0) return { avgGrade: 0, avgAttendance: 0, totalAssignments: 0 };
    
    // Use weighted grade averages for class statistics
    const avgGrade = students.reduce((sum, s) => sum + s.gradeAverage, 0) / students.length;
    const avgAttendance = students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length;
    const totalAssignments = students.reduce((sum, s) => sum + s.grades.length, 0);
    
    return { avgGrade, avgAttendance, totalAssignments };
  };
  const stats = getClassStats();

  if (loading) {
    return <Loading message="Loading student roster..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadStudents} />;
  }

  if (students.length === 0) {
    return (
      <Empty
        title="No Students Enrolled"
        description="Your class roster is empty. Students will appear here once they're enrolled."
        icon="Users"
        actionLabel="Add Student"
        onAction={() => console.log("Add student functionality")}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Student Roster</h1>
          <p className="text-slate-600 font-medium mt-2">
            Manage your students and track their academic progress
</p>
        </div>
        
        {/* View Toggle and Date Picker */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
<Button
              variant={viewMode === "roster" ? "default" : "outline"}
              onClick={() => setViewMode("roster")}
              className="gap-2"
            >
              <ApperIcon name="Users" size={16} />
              Roster
            </Button>
            <Button
              variant={viewMode === "attendance" ? "default" : "outline"}
              onClick={() => setViewMode("attendance")}
              className="gap-2"
            >
              <ApperIcon name="Calendar" size={16} />
              Attendance
            </Button>
            <Button
              variant={viewMode === "bulk-grades" ? "default" : "outline"}
              onClick={() => setViewMode("bulk-grades")}
              className="gap-2"
            >
              <ApperIcon name="Edit3" size={16} />
              Bulk Grades
            </Button>
            <Button
              variant={viewMode === "assignment" ? "default" : "outline"}
              onClick={() => setViewMode("assignment")}
              className="gap-2"
            >
              <ApperIcon name="Move" size={16} />
              Assign Classes
            </Button>
          </div>
          
          {viewMode === "attendance" && (
            <div className="flex items-center gap-2">
              <ApperIcon name="Calendar" size={16} className="text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Class Statistics */}
      {viewMode === "roster" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-500 rounded-lg">
              <ApperIcon name="Users" className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Total Students</p>
              <p className="text-2xl font-bold text-primary-900">{students.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-success-500 rounded-lg">
              <ApperIcon name="TrendingUp" className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-success-600">Class Average</p>
              <p className="text-2xl font-bold text-success-900">{stats.avgGrade.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-accent-500 rounded-lg">
              <ApperIcon name="Calendar" className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-accent-600">Attendance</p>
              <p className="text-2xl font-bold text-accent-900">{stats.avgAttendance.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-warning-500 rounded-lg">
              <ApperIcon name="BookOpen" className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-warning-600">Total Grades</p>
              <p className="text-2xl font-bold text-warning-900">{stats.totalAssignments}</p>
            </div>
</div>
        </Card>
      </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Class Roster</CardTitle>
            <SearchBar
              placeholder="Search students by name or email..."
              onSearch={setSearchTerm}
              className="w-full sm:w-80"
            />
          </div>
</CardHeader>
        <CardContent>
{viewMode === "roster" ? (
<StudentTable
              students={filteredStudents}
              onStudentSelect={handleStudentSelect}
              selectedStudent={selectedStudent}
            />
          ) : viewMode === "attendance" ? (
            renderAttendanceView()
          ) : viewMode === "assignment" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Assignment Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ApperIcon name="Move" size={20} />
                    Class Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ApperIcon name="Info" size={20} className="text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">How to assign students:</h4>
                        <ul className="mt-2 text-sm text-blue-700 space-y-1">
                          <li>• Drag students from the roster to class cards below</li>
                          <li>• Select multiple students and use bulk assignment buttons</li>
                          <li>• Use checkboxes for bulk operations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Classes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ApperIcon name="BookOpen" size={20} />
                    Available Classes
                    {selectedStudents.size > 0 && (
                      <Badge variant="secondary">
                        {selectedStudents.size} students selected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableClasses.map((classItem) => (
                      <motion.div
                        key={classItem.Id}
                        className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                          dragOverClass === classItem.Id
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                        onDragOver={(e) => handleClassDragOver(e, classItem.Id)}
                        onDragLeave={handleClassDragLeave}
                        onDrop={(e) => handleClassDrop(e, classItem)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-4 h-4 rounded-full ${
                            classItem.color === 'primary' ? 'bg-primary-500' :
                            classItem.color === 'accent' ? 'bg-accent-500' :
                            classItem.color === 'success' ? 'bg-success-500' :
                            classItem.color === 'warning' ? 'bg-warning-500' :
                            'bg-error-500'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-slate-900">{classItem.name}</h3>
                            <p className="text-sm text-slate-600">{classItem.subject}</p>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500 mb-3">
                          {classItem.period} • {classItem.room}
                        </div>
                        
                        {selectedStudents.size > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkAssignToClass(classItem.Id)}
                            disabled={assignmentLoading}
                            className="w-full gap-2"
                          >
                            {assignmentLoading ? (
                              <ApperIcon name="Loader2" size={14} className="animate-spin" />
                            ) : (
                              <ApperIcon name="UserPlus" size={14} />
                            )}
                            Assign {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Student Roster with Drag Support */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ApperIcon name="Users" size={20} />
                      Student Roster
                    </CardTitle>
                    {selectedStudents.size > 0 && (
                      <Button
                        onClick={() => setSelectedStudents(new Set())}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <ApperIcon name="X" size={14} />
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <StudentTable
                    students={filteredStudents}
                    onStudentSelect={handleStudentSelect}
                    selectedStudent={selectedStudent}
                    showCheckboxes={true}
                    selectedStudents={selectedStudents}
                    onStudentToggle={handleStudentToggle}
                    onSelectAll={handleSelectAll}
                    enableDrag={true}
                    onDragStart={handleStudentDragStart}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Bulk Grade Entry Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ApperIcon name="Edit3" size={20} />
                    Assignment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="assignmentName">Assignment Name</Label>
                      <Input
                        id="assignmentName"
                        value={bulkGradeData.assignmentName}
                        onChange={(e) => handleBulkGradeChange("assignmentName", e.target.value)}
                        placeholder="Enter assignment name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxScore">Max Score</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={bulkGradeData.maxScore}
                        onChange={(e) => handleBulkGradeChange("maxScore", e.target.value)}
                        placeholder="100"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gradeDate">Date</Label>
                      <Input
                        id="gradeDate"
                        type="date"
                        value={bulkGradeData.date}
                        onChange={(e) => handleBulkGradeChange("date", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={bulkGradeData.category}
                        onChange={(e) => handleBulkGradeChange("category", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Assignment">Assignment</option>
                        <option value="Test">Test</option>
                        <option value="Quiz">Quiz</option>
                        <option value="Homework">Homework</option>
                        <option value="Project">Project</option>
                        <option value="Participation">Participation</option>
                      </select>
                    </div>
                  </div>
                  {bulkGradeData.maxScore && selectedStudents.size > 0 && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Quick Grade Entry</Label>
                          <p className="text-xs text-slate-500">Apply to all selected students</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['A', 'B', 'C', 'D', 'F'].map(grade => (
                            <Button
                              key={grade}
                              variant="outline"
                              size="sm"
                              onClick={() => handleBulkQuickGrade(grade)}
                              className="gap-1"
                            >
                              {grade}
                              <span className="text-xs text-slate-500">
                                ({grade === 'A' ? '90%' : grade === 'B' ? '80%' : grade === 'C' ? '70%' : grade === 'D' ? '60%' : '0%'})
                              </span>
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkQuickGrade('Full')}
                            className="gap-1 text-success-600 hover:text-success-700 border-success-200 hover:border-success-300"
                          >
                            Full Credit
                            <span className="text-xs text-slate-500">(100%)</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkQuickGrade('Incomplete')}
                            className="gap-1 text-warning-600 hover:text-warning-700 border-warning-200 hover:border-warning-300"
                          >
                            Incomplete
                            <span className="text-xs text-slate-500">(0%)</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Student Grade Entry Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ApperIcon name="Users" size={20} />
                      Student Grades
                      {selectedStudents.size > 0 && (
                        <Badge variant="secondary">
                          {selectedStudents.size} selected
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      onClick={handleBulkGradeSubmit}
                      disabled={selectedStudents.size === 0 || bulkLoading}
                      className="gap-2"
                    >
                      {bulkLoading ? (
                        <ApperIcon name="Loader2" size={16} className="animate-spin" />
                      ) : (
                        <ApperIcon name="Save" size={16} />
                      )}
                      Save Grades
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                          <tr>
                            <th className="px-6 py-4 text-left">
                              <input
                                type="checkbox"
                                checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                                onChange={handleSelectAll}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Current Average
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {filteredStudents.map((student) => (
                            <tr
                              key={student.Id}
                              className={`hover:bg-slate-50 transition-colors ${
                                selectedStudents.has(student.Id) ? "bg-primary-50" : ""
                              }`}
                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.has(student.Id)}
                                  onChange={() => handleStudentToggle(student.Id)}
                                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
                                      {student.firstName[0]}{student.lastName[0]}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-slate-900">
                                      {student.firstName} {student.lastName}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      {student.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={
                                  student.gradeAverage >= 90 ? "success" :
                                  student.gradeAverage >= 80 ? "secondary" :
                                  student.gradeAverage >= 70 ? "warning" : "destructive"
                                }>
                                  {student.gradeAverage.toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                {selectedStudents.has(student.Id) ? (
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      value={studentGrades[student.Id] || ""}
                                      onChange={(e) => handleStudentGradeChange(student.Id, e.target.value)}
                                      placeholder="Enter score"
                                      min="0"
                                      max={bulkGradeData.maxScore || 100}
                                      step="0.1"
                                      className="w-24"
                                    />
                                    {bulkGradeData.maxScore && (
                                      <div className="flex flex-wrap gap-1">
                                        {['A', 'B', 'C', 'D', 'F'].map(grade => (
                                          <Button
                                            key={grade}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickGrade(student.Id, grade)}
                                            className="h-6 px-2 text-xs font-medium"
                                          >
                                            {grade}
                                          </Button>
                                        ))}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleQuickGrade(student.Id, 'Full')}
                                          className="h-6 px-2 text-xs font-medium text-success-600 hover:text-success-700"
                                        >
                                          Full
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleQuickGrade(student.Id, 'Incomplete')}
                                          className="h-6 px-2 text-xs font-medium text-warning-600 hover:text-warning-700"
                                        >
                                          Inc
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-sm">Select to enter score</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={handleCloseDetail}
          onGradeAdd={handleGradeAdd}
        />
      )}
    </motion.div>
  );
};

export default StudentsPage;