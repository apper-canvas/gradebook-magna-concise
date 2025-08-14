import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, startOfMonth, subMonths } from "date-fns";
import { studentService } from "@/services/api/studentService";
import ApperIcon from "@/components/ApperIcon";
import GradeIndicator from "@/components/molecules/GradeIndicator";
import FormField from "@/components/molecules/FormField";
import StudentGradeTrendsChart from "@/components/molecules/StudentGradeTrendsChart";
import Loading from "@/components/ui/Loading";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Label from "@/components/atoms/Label";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
export default function StudentDetailPanel({ student, onClose, onGradeAdd, onParentContactAdd, onParentContactUpdate, onParentContactDelete }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [notes, setNotes] = useState(student.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(student);
  const [newGrade, setNewGrade] = useState({
    assignmentName: "",
    score: "",
    maxScore: "100",
    date: new Date().toISOString().split("T")[0],
    category: "Test"
  });
  
  // Behavior tracking state
  const [behaviorIncidents, setBehaviorIncidents] = useState([]);
  const [loadingBehavior, setLoadingBehavior] = useState(false);
  const [showBehaviorForm, setShowBehaviorForm] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState(null);
  const [behaviorFilter, setBehaviorFilter] = useState('all');
  const [newBehaviorIncident, setNewBehaviorIncident] = useState({
    type: 'disciplinary',
    category: 'Disruption',
    severity: 'Medium',
    description: '',
    actionTaken: ''
  });
  
  // Parent Contact Management State
  const [showParentContactForm, setShowParentContactForm] = useState(false);
  const [editingParentContact, setEditingParentContact] = useState(null);
  const [newParentContact, setNewParentContact] = useState({
    firstName: "",
    lastName: "",
    relationship: "Parent",
    email: "",
    phone: "",
    workPhone: "",
    address: "",
    isPrimary: false,
    emergencyContact: false
  });

useEffect(() => {
    loadAttendanceHistory();
    loadBehaviorIncidents();
    setCurrentStudent(student);
    setNotes(student.notes || "");

    // Listen for class changes and refresh student data
    const handleClassChange = async (event) => {
      try {
        const updatedStudent = await studentService.getById(student.Id);
        setCurrentStudent(updatedStudent);
        setNotes(updatedStudent.notes || "");
        loadAttendanceHistory();
        loadBehaviorIncidents();
      } catch (error) {
        console.error("Failed to refresh student data:", error);
      }
    };

    window.addEventListener('classChanged', handleClassChange);

    return () => {
      window.removeEventListener('classChanged', handleClassChange);
    };
  }, [student.Id]);

  // Load behavior incidents
  const loadBehaviorIncidents = async () => {
    setLoadingBehavior(true);
    try {
      const incidents = await studentService.getBehaviorIncidents(student.Id);
      setBehaviorIncidents(incidents);
    } catch (error) {
      console.error("Failed to load behavior incidents:", error);
      toast.error("Failed to load behavior incidents");
    } finally {
      setLoadingBehavior(false);
    }
  };

  // Handle behavior incident form
  const handleBehaviorFormSubmit = async () => {
    if (!newBehaviorIncident.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    try {
      if (editingBehavior) {
        await studentService.updateBehaviorIncident(student.Id, editingBehavior.Id, newBehaviorIncident);
        toast.success("Behavior incident updated successfully");
      } else {
        await studentService.addBehaviorIncident(student.Id, newBehaviorIncident);
        toast.success("Behavior incident logged successfully");
      }
      
      loadBehaviorIncidents();
      setShowBehaviorForm(false);
      setEditingBehavior(null);
      setNewBehaviorIncident({
        type: 'disciplinary',
        category: 'Disruption',
        severity: 'Medium',
        description: '',
        actionTaken: ''
      });
    } catch (error) {
      console.error("Failed to save behavior incident:", error);
      toast.error("Failed to save behavior incident");
    }
  };

  const handleEditBehaviorIncident = (incident) => {
    setEditingBehavior(incident);
    setNewBehaviorIncident({
      type: incident.type,
      category: incident.category,
      severity: incident.severity,
      description: incident.description,
      actionTaken: incident.actionTaken
    });
    setShowBehaviorForm(true);
  };

  const handleDeleteBehaviorIncident = async (incidentId) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    
    try {
      await studentService.deleteBehaviorIncident(student.Id, incidentId);
      toast.success("Behavior incident deleted");
      loadBehaviorIncidents();
    } catch (error) {
      console.error("Failed to delete behavior incident:", error);
      toast.error("Failed to delete incident");
    }
  };

  const filteredBehaviorIncidents = behaviorIncidents.filter(incident => {
    if (behaviorFilter === 'all') return true;
    return incident.type === behaviorFilter;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
            className="h-8 w-8 p-0">
            <ApperIcon name="ChevronLeft" className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-slate-900">
            {format(currentCalendarMonth, "MMMM yyyy")}
        </h3>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentCalendarMonth(addMonths(currentCalendarMonth, 1))}
            className="h-8 w-8 p-0">
            <ApperIcon name="ChevronRight" className="h-4 w-4" />
        </Button>
    </div>
    {/* Days of Week Header */}
    <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            day => <div key={day} className="text-center text-xs font-medium text-slate-600 py-2">
                {day}
            </div>
        )}
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
                  ${isCurrentMonth ? "hover:bg-slate-100" : "opacity-30 cursor-not-allowed"}
                  ${isToday ? "ring-2 ring-primary-500 ring-offset-1" : ""}
                  ${status ? getStatusColor(status) + " text-white hover:opacity-90" : "text-slate-700 hover:bg-slate-100"}
                  ${!status && isCurrentMonth ? "border border-slate-200" : ""}
                `}
                    title={status ? `${format(day, "MMM d")}: ${status}` : format(day, "MMM d")}>
                    {format(day, "d")}
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

                {/* Behavior Tab Content */}
                {activeTab === "behavior" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">Behavior Timeline</h3>
                        <div className="flex items-center space-x-2">
                          <select
                            value={behaviorFilter}
                            onChange={(e) => setBehaviorFilter(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="all">All Incidents</option>
                            <option value="disciplinary">Disciplinary Only</option>
                            <option value="positive">Positive Only</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowBehaviorForm(true)}
                        className="gap-2"
                      >
                        <ApperIcon name="Plus" size={16} />
                        Log Incident
                      </Button>
                    </div>

                    {loadingBehavior ? (
                      <Loading message="Loading behavior incidents..." />
                    ) : filteredBehaviorIncidents.length === 0 ? (
                      <Card className="p-8 text-center">
                        <ApperIcon name="FileText" size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Behavior Incidents</h3>
                        <p className="text-gray-500">
                          {behaviorFilter === 'all' ? 'No incidents recorded yet.' : `No ${behaviorFilter} incidents recorded.`}
                        </p>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {filteredBehaviorIncidents.map((incident) => (
                          <Card key={incident.Id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge 
                                    variant={incident.type === 'disciplinary' ? 'destructive' : 'success'}
                                    className="text-xs"
                                  >
                                    {incident.type === 'disciplinary' ? incident.category : 'Positive'}
                                  </Badge>
                                  <Badge 
                                    className={`text-xs ${getSeverityColor(incident.severity)}`}
                                  >
                                    {incident.severity}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(incident.timestamp), 'MMM dd, yyyy h:mm a')}
                                  </span>
                                </div>
                                <p className="text-gray-800 mb-2">{incident.description}</p>
                                {incident.actionTaken && (
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                      <strong>Action Taken:</strong> {incident.actionTaken}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBehaviorIncident(incident)}
                                >
                                  <ApperIcon name="Edit2" size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBehaviorIncident(incident.Id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <ApperIcon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Behavior Incident Form Modal */}
                    {showBehaviorForm && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              {editingBehavior ? 'Edit Incident' : 'Log New Incident'}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowBehaviorForm(false);
                                  setEditingBehavior(null);
                                  setNewBehaviorIncident({
                                    type: 'disciplinary',
                                    category: 'Disruption',
                                    severity: 'Medium',
                                    description: '',
                                    actionTaken: ''
                                  });
                                }}
                              >
                                <ApperIcon name="X" size={16} />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField label="Type">
                              <select
                                value={newBehaviorIncident.type}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="disciplinary">Disciplinary</option>
                                <option value="positive">Positive</option>
                              </select>
                            </FormField>

                            {newBehaviorIncident.type === 'disciplinary' && (
                              <FormField label="Category">
                                <select
                                  value={newBehaviorIncident.category}
                                  onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, category: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="Disruption">Disruption</option>
                                  <option value="Tardiness">Tardiness</option>
                                </select>
                              </FormField>
                            )}

                            <FormField label="Severity">
                              <select
                                value={newBehaviorIncident.severity}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, severity: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </FormField>

                            <FormField label="Description" error="">
                              <textarea
                                value={newBehaviorIncident.description}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows="3"
                                placeholder="Describe the incident..."
                              />
                            </FormField>

                            <FormField label="Action Taken (Optional)">
                              <textarea
                                value={newBehaviorIncident.actionTaken}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, actionTaken: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows="2"
                                placeholder="What action was taken..."
                              />
                            </FormField>

                            <div className="flex space-x-3 pt-4">
                              <Button
                                onClick={handleBehaviorFormSubmit}
                                className="flex-1"
                              >
                                {editingBehavior ? 'Update Incident' : 'Log Incident'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowBehaviorForm(false);
                                  setEditingBehavior(null);
                                  setNewBehaviorIncident({
                                    type: 'disciplinary',
                                    category: 'Disruption',
                                    severity: 'Medium',
                                    description: '',
                                    actionTaken: ''
                                  });
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
)}
                  </div>
                )}
                
                {/* Behavior Tab Content */}
                {activeTab === "behavior" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">Behavior Timeline</h3>
                        <div className="flex items-center space-x-2">
                          <select
                            value={behaviorFilter}
                            onChange={(e) => setBehaviorFilter(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="all">All Incidents</option>
                            <option value="disciplinary">Disciplinary Only</option>
                            <option value="positive">Positive Only</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowBehaviorForm(true)}
                        className="gap-2"
                      >
                        <ApperIcon name="Plus" size={16} />
                        Log Incident
                      </Button>
                    </div>

                    {loadingBehavior ? (
                      <Loading message="Loading behavior incidents..." />
                    ) : filteredBehaviorIncidents.length === 0 ? (
                      <Card className="p-8 text-center">
                        <ApperIcon name="FileText" size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Behavior Incidents</h3>
                        <p className="text-gray-500">
                          {behaviorFilter === 'all' ? 'No incidents recorded yet.' : `No ${behaviorFilter} incidents recorded.`}
                        </p>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {filteredBehaviorIncidents.map((incident) => (
                          <Card key={incident.Id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge 
                                    variant={incident.type === 'disciplinary' ? 'destructive' : 'success'}
                                    className="text-xs"
                                  >
                                    {incident.type === 'disciplinary' ? incident.category : 'Positive'}
                                  </Badge>
                                  <Badge 
                                    className={`text-xs ${getSeverityColor(incident.severity)}`}
                                  >
                                    {incident.severity}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(incident.timestamp), 'MMM dd, yyyy h:mm a')}
                                  </span>
                                </div>
                                <p className="text-gray-800 mb-2">{incident.description}</p>
                                {incident.actionTaken && (
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                      <strong>Action Taken:</strong> {incident.actionTaken}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBehaviorIncident(incident)}
                                >
                                  <ApperIcon name="Edit2" size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBehaviorIncident(incident.Id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <ApperIcon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Behavior Incident Form Modal */}
                    {showBehaviorForm && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              {editingBehavior ? 'Edit Incident' : 'Log New Incident'}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowBehaviorForm(false);
                                  setEditingBehavior(null);
                                  setNewBehaviorIncident({
                                    type: 'disciplinary',
                                    category: 'Disruption',
                                    severity: 'Medium',
                                    description: '',
                                    actionTaken: ''
                                  });
                                }}
                              >
                                <ApperIcon name="X" size={16} />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField label="Type">
                              <select
                                value={newBehaviorIncident.type}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="disciplinary">Disciplinary</option>
                                <option value="positive">Positive</option>
                              </select>
                            </FormField>

                            {newBehaviorIncident.type === 'disciplinary' && (
                              <FormField label="Category">
                                <select
                                  value={newBehaviorIncident.category}
                                  onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, category: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="Disruption">Disruption</option>
                                  <option value="Tardiness">Tardiness</option>
                                </select>
                              </FormField>
                            )}

                            <FormField label="Severity">
                              <select
                                value={newBehaviorIncident.severity}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, severity: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </FormField>

                            <FormField label="Description" error="">
                              <textarea
                                value={newBehaviorIncident.description}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows="3"
                                placeholder="Describe the incident..."
                              />
                            </FormField>

                            <FormField label="Action Taken (Optional)">
                              <textarea
                                value={newBehaviorIncident.actionTaken}
                                onChange={(e) => setNewBehaviorIncident(prev => ({ ...prev, actionTaken: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows="2"
                                placeholder="What action was taken..."
                              />
                            </FormField>

                            <div className="flex space-x-3 pt-4">
                              <Button
                                onClick={handleBehaviorFormSubmit}
                                className="flex-1"
                              >
                                {editingBehavior ? 'Update Incident' : 'Log Incident'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowBehaviorForm(false);
                                  setEditingBehavior(null);
                                  setNewBehaviorIncident({
                                    type: 'disciplinary',
                                    category: 'Disruption',
                                    severity: 'Medium',
                                    description: '',
                                    actionTaken: ''
                                  });
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
            </div>
        </motion.div>
    </motion.div>
    </AnimatePresence>
    );
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

  // Parent Contact Management Functions
  const handleAddParentContact = () => {
    if (!newParentContact.firstName.trim() || !newParentContact.lastName.trim()) {
      toast.error("Please fill in first name and last name");
      return;
    }

    onParentContactAdd(student.Id, newParentContact);
    setNewParentContact({
      firstName: "",
      lastName: "",
      relationship: "Parent",
      email: "",
      phone: "",
      workPhone: "",
      address: "",
      isPrimary: false,
      emergencyContact: false
    });
    setShowParentContactForm(false);
  };

  const handleEditParentContact = (contact) => {
    setEditingParentContact(contact);
    setNewParentContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      relationship: contact.relationship,
      email: contact.email || "",
      phone: contact.phone || "",
      workPhone: contact.workPhone || "",
      address: contact.address || "",
      isPrimary: contact.isPrimary,
      emergencyContact: contact.emergencyContact
    });
    setShowParentContactForm(true);
  };

  const handleUpdateParentContact = () => {
    if (!newParentContact.firstName.trim() || !newParentContact.lastName.trim()) {
      toast.error("Please fill in first name and last name");
      return;
    }

    onParentContactUpdate(student.Id, editingParentContact.Id, newParentContact);
    setEditingParentContact(null);
    setNewParentContact({
      firstName: "",
      lastName: "",
      relationship: "Parent",
      email: "",
      phone: "",
      workPhone: "",
      address: "",
      isPrimary: false,
      emergencyContact: false
    });
    setShowParentContactForm(false);
  };

  const handleDeleteParentContact = (contactId) => {
    if (window.confirm("Are you sure you want to delete this parent contact?")) {
      onParentContactDelete(student.Id, contactId);
    }
  };

  const handleCancelParentContactForm = () => {
    setShowParentContactForm(false);
    setEditingParentContact(null);
    setNewParentContact({
      firstName: "",
      lastName: "",
      relationship: "Parent",
      email: "",
      phone: "",
      workPhone: "",
      address: "",
      isPrimary: false,
      emergencyContact: false
    });
  };

const getGradeVariant = (percentage) => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "info";
    if (percentage >= 70) return "warning";
    return "error";
  };
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <AnimatePresence>
    <motion.div
        initial={{
            opacity: 0
        }}
        animate={{
            opacity: 1
        }}
        exit={{
            opacity: 0
        }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}>
        <motion.div
            initial={{
                scale: 0.9,
                opacity: 0,
                y: 50
            }}
            animate={{
                scale: 1,
                opacity: 1,
                y: 0
            }}
            exit={{
                scale: 0.9,
                opacity: 0,
                y: 50
            }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div
                className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div
                            className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
                            <p className="text-white/80 font-medium">Grade {student.gradeLevel}• {student.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white hover:bg-white/20 border-white/30">
                        <ApperIcon name="X" className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="bg-gray-50 px-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("grades")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "grades"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Grades
                </button>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "attendance"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveTab("behavior")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "behavior"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Behavior
                </button>
                <button
                  onClick={() => setActiveTab("contacts")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "contacts"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Parent Contacts
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "notes"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Notes
                </button>
              </nav>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                {/* Overview Tab Content */}
                {activeTab === "overview" && (
                  <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card
                            className="p-6 text-center bg-gradient-to-br from-success-50 to-success-100 border-success-200">
                            <div className="text-3xl font-bold gradient-text mb-2">
                                {student.gradeAverage.toFixed(1)}%
                                                </div>
                            <div className="text-sm text-success-700 font-semibold">Weighted Average</div>
                        </Card>
                        <Card
                            className="p-6 text-center bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                            <div className="text-3xl font-bold gradient-text mb-2">
                                {student.attendancePercentage.toFixed(1)}%
                                                </div>
                            <div className="text-sm text-primary-700 font-semibold">Attendance Rate
                                                  <div className="text-xs text-primary-600 mt-1">Running: {Object.keys(attendanceHistory).length > 0 ? `${Object.keys(attendanceHistory).length} days tracked` : "Based on default rate"}
                                </div>
                            </div>
                        </Card>
                        <Card
                            className="p-6 text-center bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
                            <div className="text-3xl font-bold gradient-text mb-2">
                                {student.grades.length}
                            </div>
                            <div className="text-sm text-accent-700 font-semibold">Total Assignments</div>
                        </Card>
                    </div>
                    
                    {/* Recent Performance Chart */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ApperIcon name="TrendingUp" size={20} className="text-primary-600" />
                                Grade Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StudentGradeTrendsChart studentId={student.Id} />
                        </CardContent>
                    </Card>
                  </>
                )}
                
                {/* Grades Tab Content */}
                {activeTab === "grades" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3>
<Button onClick={() => setShowAddForm(true)} className="gap-2">
                        <ApperIcon name="Plus" size={16} />
                        Add Grade
                      </Button>
                    </div>
                    
                    {/* Grades List */}
                    <div className="space-y-4">
                      {currentStudent.grades?.length === 0 ? (
                        <Card className="p-8 text-center">
                          <ApperIcon name="BookOpen" size={48} className="mx-auto text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Grades Yet</h3>
                          <p className="text-gray-500">Start by adding the first grade for this student.</p>
                        </Card>
                      ) : (
                        currentStudent.grades?.map((grade, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h4 className="font-semibold text-gray-900">{grade.assignmentName}</h4>
                                  <Badge variant={getGradeVariant((grade.score / grade.maxScore) * 100)}>
                                    {grade.score}/{grade.maxScore} ({((grade.score / grade.maxScore) * 100).toFixed(1)}%)
                                  </Badge>
                                  <span className="text-sm text-gray-500">{grade.category}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {format(new Date(grade.date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <GradeIndicator percentage={(grade.score / grade.maxScore) * 100} />
                            </div>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Add Grade Form */}
                    {showAddForm && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              Add New Grade
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddForm(false)}
                              >
                                <ApperIcon name="X" size={16} />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField label="Assignment Name">
                              <Input
                                value={newGrade.assignmentName}
                                onChange={(e) => setNewGrade(prev => ({ ...prev, assignmentName: e.target.value }))}
                                placeholder="Enter assignment name"
                              />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField label="Score">
                                <Input
                                  type="number"
                                  value={newGrade.score}
                                  onChange={(e) => setNewGrade(prev => ({ ...prev, score: e.target.value }))}
                                  placeholder="Score"
                                />
                              </FormField>
                              <FormField label="Max Score">
                                <Input
                                  type="number"
                                  value={newGrade.maxScore}
                                  onChange={(e) => setNewGrade(prev => ({ ...prev, maxScore: e.target.value }))}
                                  placeholder="Max score"
                                />
                              </FormField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField label="Date">
                                <Input
                                  type="date"
                                  value={newGrade.date}
                                  onChange={(e) => setNewGrade(prev => ({ ...prev, date: e.target.value }))}
                                />
                              </FormField>
                              <FormField label="Category">
                                <select
                                  value={newGrade.category}
                                  onChange={(e) => setNewGrade(prev => ({ ...prev, category: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="Test">Test</option>
                                  <option value="Assignment">Assignment</option>
                                  <option value="Quiz">Quiz</option>
                                  <option value="Project">Project</option>
                                </select>
                              </FormField>
                            </div>

                            <div className="flex space-x-3 pt-4">
                              <Button onClick={handleAddGrade} className="flex-1">
                                Add Grade
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowAddForm(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                )}
                
                {/* Attendance Tab Content */}
                {activeTab === "attendance" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Calendar</h3>
                    {renderCalendar()}
                  </div>
                )}
                
                {/* Parent Contacts Tab Content */}
                {activeTab === "contacts" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Parent Contacts</h3>
<Button onClick={() => setShowParentContactForm(true)} className="gap-2">
                        <ApperIcon name="Plus" size={16} />
                        Add Contact
                      </Button>
                    </div>
                    
                    {/* Parent Contacts List */}
                    <div className="space-y-4">
                      {currentStudent.parentContacts?.length === 0 ? (
                        <Card className="p-8 text-center">
                          <ApperIcon name="Users" size={48} className="mx-auto text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Parent Contacts</h3>
                          <p className="text-gray-500">Add parent or guardian contact information.</p>
                        </Card>
                      ) : (
                        currentStudent.parentContacts?.map((contact) => (
                          <Card key={contact.Id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {contact.firstName} {contact.lastName}
                                  </h4>
                                  <Badge variant="outline">{contact.relationship}</Badge>
                                  {contact.isPrimary && (
                                    <Badge variant="default">Primary</Badge>
                                  )}
                                  {contact.emergencyContact && (
                                    <Badge variant="destructive">Emergency</Badge>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                  {contact.email && (
                                    <div className="flex items-center gap-2">
                                      <ApperIcon name="Mail" size={14} />
                                      {contact.email}
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-2">
                                      <ApperIcon name="Phone" size={14} />
                                      {contact.phone}
                                    </div>
                                  )}
                                  {contact.workPhone && (
                                    <div className="flex items-center gap-2">
                                      <ApperIcon name="Briefcase" size={14} />
                                      {contact.workPhone}
                                    </div>
                                  )}
                                  {contact.address && (
                                    <div className="flex items-center gap-2">
                                      <ApperIcon name="MapPin" size={14} />
                                      {contact.address}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditParentContact(contact)}
                                >
                                  <ApperIcon name="Edit2" size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteParentContact(contact.Id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <ApperIcon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Parent Contact Form */}
                    {showParentContactForm && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              {editingParentContact ? 'Edit Contact' : 'Add New Contact'}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelParentContactForm}
                              >
                                <ApperIcon name="X" size={16} />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField label="First Name">
                                <Input
                                  value={newParentContact.firstName}
                                  onChange={(e) => setNewParentContact(prev => ({ ...prev, firstName: e.target.value }))}
                                  placeholder="First name"
                                />
                              </FormField>
                              <FormField label="Last Name">
                                <Input
                                  value={newParentContact.lastName}
                                  onChange={(e) => setNewParentContact(prev => ({ ...prev, lastName: e.target.value }))}
                                  placeholder="Last name"
                                />
                              </FormField>
                            </div>

                            <FormField label="Relationship">
                              <select
                                value={newParentContact.relationship}
                                onChange={(e) => setNewParentContact(prev => ({ ...prev, relationship: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="Parent">Parent</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Grandparent">Grandparent</option>
                                <option value="Other">Other</option>
                              </select>
                            </FormField>

                            <FormField label="Email">
                              <Input
                                type="email"
                                value={newParentContact.email}
                                onChange={(e) => setNewParentContact(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Email address"
                              />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField label="Phone">
                                <Input
                                  type="tel"
                                  value={newParentContact.phone}
                                  onChange={(e) => setNewParentContact(prev => ({ ...prev, phone: e.target.value }))}
                                  placeholder="Phone number"
                                />
                              </FormField>
                              <FormField label="Work Phone">
                                <Input
                                  type="tel"
                                  value={newParentContact.workPhone}
                                  onChange={(e) => setNewParentContact(prev => ({ ...prev, workPhone: e.target.value }))}
                                  placeholder="Work phone"
                                />
                              </FormField>
                            </div>

                            <FormField label="Address">
                              <Input
                                value={newParentContact.address}
                                onChange={(e) => setNewParentContact(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Home address"
                              />
                            </FormField>

                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newParentContact.isPrimary}
                                  onChange={(e) => setNewParentContact(prev => ({ ...prev, isPrimary: e.target.checked }))}
                                  className="rounded border-gray-300 focus:ring-primary-500"
                                />
                                <span className="text-sm">Primary Contact</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newParentContact.emergencyContact}
                                  onChange={(e) => setNewParentContact(prev => ({ ...prev, emergencyContact: e.target.checked }))}
                                  className="rounded border-gray-300 focus:ring-primary-500"
                                />
                                <span className="text-sm">Emergency Contact</span>
                              </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                              <Button 
                                onClick={editingParentContact ? handleUpdateParentContact : handleAddParentContact}
                                className="flex-1"
                              >
                                {editingParentContact ? 'Update Contact' : 'Add Contact'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleCancelParentContactForm}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Notes Tab Content */}
                {activeTab === "notes" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Student Notes</h3>
<Button 
                        onClick={handleNotesUpdate} 
                        disabled={isSavingNotes}
                        className="gap-2"
                      >
                        <ApperIcon name="Save" size={16} />
                        {isSavingNotes ? 'Saving...' : 'Save Notes'}
                      </Button>
                    </div>
                    
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="Add notes about this student..."
                    />
                  </div>
                )}
            </div>
        </motion.div>
    </motion.div>
</AnimatePresence>
);
};