import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { classService } from "@/services/api/classService";
import ClassForm from "@/components/organisms/ClassForm";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classStats, setClassStats] = useState({});

  useEffect(() => {
    loadClasses();
    
    // Listen for class changes from switcher
    const handleClassChange = () => {
      loadClasses();
    };
    
    window.addEventListener('classChanged', handleClassChange);
    return () => window.removeEventListener('classChanged', handleClassChange);
  }, []);

  const loadClasses = async () => {
    try {
      setError(null);
      const data = await classService.getAll();
      setClasses(data);
      
      // Load stats for each class
      const stats = {};
      for (const classItem of data) {
        try {
          stats[classItem.Id] = await classService.getClassStats(classItem.Id);
        } catch (err) {
          console.error(`Failed to load stats for class ${classItem.Id}`);
        }
      }
      setClassStats(stats);
    } catch (err) {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setShowForm(true);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleDeleteClass = async (classItem) => {
    if (!window.confirm(`Are you sure you want to delete "${classItem.name}"?`)) {
      return;
    }

    try {
      await classService.delete(classItem.Id);
      toast.success('Class deleted successfully');
      loadClasses();
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingClass(null);
    loadClasses();
  };

  const handleSetActive = async (classItem) => {
    try {
      await classService.setActive(classItem.Id);
      toast.success(`Set ${classItem.name} as active class`);
      loadClasses();
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('classChanged', { 
        detail: { classId: classItem.Id } 
      }));
    } catch (error) {
      toast.error('Failed to set active class');
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClasses = (color) => {
    const colorMap = {
      primary: 'from-primary-500 to-primary-600 border-primary-300',
      accent: 'from-accent-500 to-accent-600 border-accent-300',
      success: 'from-success-500 to-success-600 border-success-300',
      warning: 'from-warning-500 to-warning-600 border-warning-300',
      error: 'from-error-500 to-error-600 border-error-300'
    };
    return colorMap[color] || colorMap.primary;
  };

if (loading) return <Loading message="Loading classes..." />;
  if (error) return <Error message={error} onRetry={loadClasses} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Classes</h1>
          <p className="text-slate-600 font-medium mt-2">
            Manage your class periods and subjects
          </p>
        </div>
        <Button
          onClick={handleCreateClass}
          className="flex items-center space-x-2"
        >
          <ApperIcon name="Plus" className="h-4 w-4" />
          <span>Add Class</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Search classes..."
            onSearch={setSearchTerm}
            className="w-full"
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold gradient-text">
                    {editingClass ? 'Edit Class' : 'Create New Class'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    <ApperIcon name="X" className="h-4 w-4" />
                  </Button>
                </div>
                <ClassForm
                  classData={editingClass}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setShowForm(false)}
                  isEdit={!!editingClass}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredClasses.length === 0 ? (
        <Empty
          title="No Classes Found"
          description={searchTerm ? "No classes match your search criteria." : "Get started by creating your first class period."}
          icon="BookOpen"
          action={
            !searchTerm ? (
              <Button onClick={handleCreateClass} className="mt-4">
                <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
                Create First Class
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => {
            const stats = classStats[classItem.Id] || {};
            return (
              <motion.div
                key={classItem.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getColorClasses(classItem.color)} border`} />
                        <div>
                          <CardTitle className="text-lg">{classItem.name}</CardTitle>
                          <p className="text-sm text-slate-600 font-medium">
                            {classItem.subject}
                          </p>
                        </div>
                      </div>
                      {classItem.isActive && (
                        <Badge variant="success" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Period</p>
                        <p className="font-semibold">{classItem.period}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Room</p>
                        <p className="font-semibold">{classItem.room}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Time</p>
                        <p className="font-semibold">
                          {classItem.startTime} - {classItem.endTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Students</p>
                        <p className="font-semibold">{classItem.enrolledCount}</p>
                      </div>
                    </div>

                    {stats.averageGrade && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gradient-to-r from-primary-50 to-primary-100 rounded">
                          <div className="font-semibold text-primary-700">{stats.averageGrade}%</div>
                          <div className="text-primary-600">Avg Grade</div>
                        </div>
                        <div className="text-center p-2 bg-gradient-to-r from-success-50 to-success-100 rounded">
                          <div className="font-semibold text-success-700">{stats.attendanceRate}%</div>
                          <div className="text-success-600">Attendance</div>
                        </div>
                        <div className="text-center p-2 bg-gradient-to-r from-accent-50 to-accent-100 rounded">
                          <div className="font-semibold text-accent-700">{stats.recentAssignments}</div>
                          <div className="text-accent-600">Recent</div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2 border-t border-slate-100">
                      {!classItem.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(classItem)}
                          className="flex-1 text-xs"
                        >
                          <ApperIcon name="Play" className="h-3 w-3 mr-1" />
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClass(classItem)}
                        className={classItem.isActive ? 'flex-1' : ''}
                      >
                        <ApperIcon name="Edit" className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClass(classItem)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      >
                        <ApperIcon name="Trash2" className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ClassesPage;