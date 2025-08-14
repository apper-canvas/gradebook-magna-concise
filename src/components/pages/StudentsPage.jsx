import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { studentService } from "@/services/api/studentService";
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
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getAll();
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