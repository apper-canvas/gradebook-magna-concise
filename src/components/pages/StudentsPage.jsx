import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StudentTable from "@/components/organisms/StudentTable";
import StudentDetailPanel from "@/components/organisms/StudentDetailPanel";
import SearchBar from "@/components/molecules/SearchBar";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/atoms/Card";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import { studentService } from "@/services/api/studentService";

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
      </div>

      {/* Class Statistics */}
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
          <StudentTable
            students={filteredStudents}
            onStudentSelect={handleStudentSelect}
            selectedStudent={selectedStudent}
          />
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