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
          ) : (
            renderAttendanceView()
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