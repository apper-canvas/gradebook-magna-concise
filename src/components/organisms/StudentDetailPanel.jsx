import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { studentService } from "@/services/api/studentService";
import ApperIcon from "@/components/ApperIcon";
import GradeIndicator from "@/components/molecules/GradeIndicator";
import FormField from "@/components/molecules/FormField";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Label from "@/components/atoms/Label";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import StudentGradeTrendsChart from "@/components/molecules/StudentGradeTrendsChart";
const StudentDetailPanel = ({ student, onClose, onGradeAdd }) => {
const [showAddForm, setShowAddForm] = useState(false);
  const [notes, setNotes] = useState(student.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [newGrade, setNewGrade] = useState({
    assignmentName: "",
    score: "",
    maxScore: "100",
    date: new Date().toISOString().split("T")[0],
    category: "Test"
  });

  useEffect(() => {
    loadAttendanceHistory();
  }, [student.Id]);

  const loadAttendanceHistory = async () => {
    setLoadingAttendance(true);
    try {
      const history = await studentService.getStudentAttendanceHistory(student.Id);
      setAttendanceHistory(history);
    } catch (error) {
      console.error("Failed to load attendance history:", error);
      toast.error("Failed to load attendance history");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const getAttendanceStatusForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return attendanceHistory[dateKey] || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-success-500";
      case "Late":
        return "bg-warning-500";
      case "Absent":
        return "bg-error-500";
      case "Excused":
        return "bg-primary-500";
      default:
        return "bg-slate-200";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Present":
        return "text-success-700";
      case "Late":
        return "text-warning-700";
      case "Absent":
        return "text-error-700";
      case "Excused":
        return "text-primary-700";
      default:
        return "text-slate-500";
    }
  };

  const handleDateClick = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    toast.info(`Viewing attendance for ${format(date, 'MMMM d, yyyy')}`);
    // Here you could emit an event or callback to navigate to that specific date
    // For now, we'll show a toast notification
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentCalendarMonth);
    const monthEnd = endOfMonth(currentCalendarMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get the first day of the month and calculate offset for the calendar grid
    const startDay = getDay(monthStart);
    const emptyDays = Array(startDay).fill(null);
    
    const allDays = [...emptyDays, ...daysInMonth];

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentCalendarMonth(subMonths(currentCalendarMonth, 1))}
            className="h-8 w-8 p-0"
          >
            <ApperIcon name="ChevronLeft" className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold text-slate-900">
            {format(currentCalendarMonth, 'MMMM yyyy')}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentCalendarMonth(addMonths(currentCalendarMonth, 1))}
            className="h-8 w-8 p-0"
          >
            <ApperIcon name="ChevronRight" className="h-4 w-4" />
          </Button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-10"></div>;
            }

            const status = getAttendanceStatusForDate(day);
            const isCurrentMonth = isSameMonth(day, currentCalendarMonth);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={!isCurrentMonth}
                className={`
                  h-10 w-10 text-sm font-medium rounded-lg transition-all duration-200
                  ${isCurrentMonth ? 'hover:bg-slate-100' : 'opacity-30 cursor-not-allowed'}
                  ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                  ${status ? getStatusColor(status) + ' text-white hover:opacity-90' : 'text-slate-700 hover:bg-slate-100'}
                  ${!status && isCurrentMonth ? 'border border-slate-200' : ''}
                `}
                title={status ? `${format(day, 'MMM d')}: ${status}` : format(day, 'MMM d')}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success-500"></div>
            <span className="text-slate-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning-500"></div>
            <span className="text-slate-600">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-error-500"></div>
            <span className="text-slate-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary-500"></div>
            <span className="text-slate-600">Excused</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-slate-300"></div>
            <span className="text-slate-600">No Record</span>
          </div>
        </div>
      </div>
    );
  };
  const handleAddGrade = () => {
    if (!newGrade.assignmentName.trim() || !newGrade.score) {
      toast.error("Please fill in all required fields");
      return;
    }

    const score = parseFloat(newGrade.score);
    const maxScore = parseFloat(newGrade.maxScore);

    if (score < 0 || score > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}`);
      return;
    }

    const gradeData = {
      assignmentName: newGrade.assignmentName,
      score: score,
      maxScore: maxScore,
      date: newGrade.date,
      category: newGrade.category
    };

    onGradeAdd(student.Id, gradeData);
    setNewGrade({
      assignmentName: "",
      score: "",
      maxScore: "100",
      date: new Date().toISOString().split("T")[0],
      category: "Assignment"
    });
    setShowAddForm(false);
    toast.success(`Grade added for ${student.firstName} ${student.lastName}`);
  };
const handleNotesUpdate = async () => {
    if (isSavingNotes) return;
    
    setIsSavingNotes(true);
    try {
      await studentService.updateStudentNotes(student.Id, notes);
      toast.success(`Notes updated for ${student.firstName} ${student.lastName}`);
    } catch (error) {
      toast.error("Failed to update notes");
      console.error("Error updating notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getGradeVariant = (percentage) => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "info";
    if (percentage >= 70) return "warning";
    return "error";
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
                  <p className="text-white/80 font-medium">Grade {student.gradeLevel} • {student.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 border-white/30"
              >
                <ApperIcon name="X" className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Stats Overview */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 text-center bg-gradient-to-br from-success-50 to-success-100 border-success-200">
                <div className="text-3xl font-bold gradient-text mb-2">
                  {student.gradeAverage.toFixed(1)}%
                </div>
                <div className="text-sm text-success-700 font-semibold">Weighted Average</div>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                <div className="text-3xl font-bold gradient-text mb-2">
                  {student.attendancePercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-primary-700 font-semibold">Attendance Rate</div>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
                <div className="text-3xl font-bold gradient-text mb-2">
                  {student.grades.length}
                </div>
                <div className="text-sm text-accent-700 font-semibold">Total Assignments</div>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Grade Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const categoryBreakdown = studentService.getCategoryBreakdown(student.Id);
                    const categoryWeights = studentService.getCategoryWeights();
                    
                    return Object.entries(categoryWeights).map(([category, weight]) => {
                      const data = categoryBreakdown[category] || { average: 0, count: 0 };
                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{category}</h4>
                            <Badge variant="default" className="text-xs">
                              {weight}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-slate-900">
                              {data.average.toFixed(1)}%
                            </div>
                            <div className="text-sm text-slate-600">
                              {data.count} item{data.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                            <div 
                              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(data.average, 100)}%` }}
                            />
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
</Card>

            {/* Grade Trends Chart */}
<div className="mb-8">
              <StudentGradeTrendsChart student={student} />
            </div>

            {/* Personal Notes Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Personal Notes & Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="student-notes" className="text-sm font-semibold text-slate-700">
                    Add personal observations, behavior notes, or comments about {student.firstName}
                  </Label>
                  <div className="relative">
                    <textarea
                      id="student-notes"
                      placeholder="Enter your notes and observations about this student..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={handleNotesUpdate}
                      className="flex w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-y transition-all duration-200"
                      disabled={isSavingNotes}
                    />
                    {isSavingNotes && (
                      <div className="absolute top-3 right-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Notes are automatically saved when you click outside the text area</span>
                    <span>{notes.length} characters</span>
                  </div>
                  {notes.trim() && (
                    <div className="flex items-center gap-2 text-sm text-success-600 font-medium">
                      <ApperIcon name="CheckCircle" className="h-4 w-4" />
                      Notes saved successfully
                    </div>
                  )}
                </div>
              </CardContent>
</Card>

            {/* Attendance Calendar */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ApperIcon name="Calendar" className="h-5 w-5 text-primary-600" />
                  Attendance Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAttendance ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                    <span className="ml-3 text-slate-600">Loading attendance history...</span>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </CardContent>
            </Card>

            {/* Add Grade Section */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Grade Management</CardTitle>
                  <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="gap-2"
                  >
                    <ApperIcon name="Plus" className="h-4 w-4" />
                    Add Grade
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Assignment Name" required>
                          <Input
                            placeholder="Enter assignment name"
                            value={newGrade.assignmentName}
                            onChange={(e) => setNewGrade({ ...newGrade, assignmentName: e.target.value })}
                          />
                        </FormField>
                        <FormField label="Category">
                          <select
                            className="flex w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            value={newGrade.category}
                            onChange={(e) => setNewGrade({ ...newGrade, category: e.target.value })}
                          >
                            <option value="Test">Test (35%)</option>
                            <option value="Quiz">Quiz (20%)</option>
                            <option value="Homework">Homework (20%)</option>
                            <option value="Project">Project (15%)</option>
                            <option value="Participation">Participation (10%)</option>
                          </select>
                        </FormField>
                        <FormField label="Score" required>
                          <Input
                            type="number"
                            placeholder="Enter score"
                            value={newGrade.score}
                            onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                            min="0"
                            max={newGrade.maxScore}
                            step="0.1"
                          />
                        </FormField>
                        <FormField label="Max Score">
                          <Input
                            type="number"
                            placeholder="Maximum points"
                            value={newGrade.maxScore}
                            onChange={(e) => setNewGrade({ ...newGrade, maxScore: e.target.value })}
                            min="1"
                            step="0.1"
                          />
                        </FormField>
                        <FormField label="Date">
                          <Input
                            type="date"
                            value={newGrade.date}
                            onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })}
                          />
                        </FormField>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <Button
                          variant="secondary"
                          onClick={() => setShowAddForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddGrade}>
                          Add Grade
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

{/* Grades History by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Grade History by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {student.grades.length === 0 ? (
                  <div className="text-center py-12">
                    <ApperIcon name="BookOpen" className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No grades recorded yet</p>
                    <p className="text-sm text-slate-400">Add the first assignment grade to get started</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const categoryBreakdown = studentService.getCategoryBreakdown(student.Id);
                      const categoryWeights = studentService.getCategoryWeights();
                      
                      return Object.entries(categoryBreakdown).map(([category, data]) => (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-l-4 border-primary-500 pl-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-slate-900">{category}</h3>
                              <Badge variant="default" className="text-xs">
                                Weight: {categoryWeights[category] || 0}%
                              </Badge>
                              <Badge variant={getGradeVariant(data.average)}>
                                Avg: {data.average.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-3 ml-4">
                            {data.grades.map((grade) => {
                              const percentage = (grade.score / grade.maxScore) * 100;
                              return (
                                <motion.div
                                  key={grade.Id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900 mb-1">{grade.assignmentName}</h4>
                                    <p className="text-sm text-slate-600 font-medium">
                                      {format(new Date(grade.date), "MMMM d, yyyy")}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center space-x-3 mb-1">
                                      <span className="text-lg font-bold text-slate-900">
                                        {grade.score}/{grade.maxScore}
                                      </span>
                                      <Badge variant={getGradeVariant(percentage)}>
                                        {percentage.toFixed(1)}%
                                      </Badge>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentDetailPanel;