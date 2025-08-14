import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'react-toastify';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { reportsService } from '@/services/api/reportsService';
import { studentService } from '@/services/api/studentService';
import { classService } from '@/services/api/classService';
import Card, { CardHeader, CardTitle, CardContent } from "@/components/atoms/Card";
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import Badge from '@/components/atoms/Badge';
import ApperIcon from "@/components/ApperIcon";
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';

const ReportsPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedReportType) {
      loadTemplates();
    }
  }, [selectedReportType]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, reportTypesData] = await Promise.all([
        studentService.getAll(),
        reportsService.getReportTypes()
      ]);
      setStudents(studentsData);
      setReportTypes(reportTypesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await reportsService.getTemplates(selectedReportType);
      setTemplates(templatesData);
    } catch (err) {
      toast.error('Failed to load templates');
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.Id));
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType || !selectedTemplate || selectedStudents.length === 0) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const reportConfig = {
        studentIds: selectedStudents,
        startDate,
        endDate,
        reportType: selectedReportType,
        templateId: selectedTemplate
      };

      const report = await reportsService.generateReport(reportConfig);
      setGeneratedReport(report);
      setCurrentStep(4);
      toast.success('Report generated successfully!');
    } catch (err) {
      toast.error('Failed to generate report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format) => {
    if (!generatedReport) return;

    setLoading(true);
    try {
      const exportData = await reportsService.exportReport(generatedReport, format);
      toast.success(`Report exported as ${format.toUpperCase()}!`);
      // In a real app, this would trigger a download
      console.log('Export data:', exportData);
    } catch (err) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReport = async () => {
    if (!generatedReport || !emailRecipients.trim()) {
      toast.error('Please provide email recipients');
      return;
    }

    setLoading(true);
    try {
      const emailConfig = {
        recipients: emailRecipients.split(',').map(email => email.trim()),
        subject: emailSubject || `Student Report - ${selectedReportType}`,
        message: emailMessage
      };

      await reportsService.emailReport(generatedReport, emailConfig);
      toast.success('Report emailed successfully!');
    } catch (err) {
      toast.error('Failed to email report');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedStudents([]);
    setSelectedReportType('');
    setSelectedTemplate('');
    setGeneratedReport(null);
    setEmailRecipients('');
    setEmailSubject('');
    setEmailMessage('');
  };

  const getStepperClasses = (step) => {
    if (step < currentStep) return 'bg-success-500 text-white';
    if (step === currentStep) return 'bg-primary-500 text-white';
    return 'bg-slate-200 text-slate-500';
  };

  if (loading && currentStep === 1) {
    return <Loading message="Loading report data..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadInitialData} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text">Reports</h1>
        <p className="text-slate-600 font-medium mt-2">
          Generate comprehensive student reports for parent communication
        </p>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Select Students' },
              { step: 2, label: 'Configure Report' },
              { step: 3, label: 'Preview' },
              { step: 4, label: 'Export & Share' }
            ].map(({ step, label }, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${getStepperClasses(step)}`}>
                  {step < currentStep ? <ApperIcon name="Check" size={16} /> : step}
                </div>
                <span className="ml-2 text-sm font-medium text-slate-700">{label}</span>
                {index < 3 && (
                  <div className="w-16 h-0.5 bg-slate-200 mx-4">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        step < currentStep ? 'bg-success-500 w-full' : 'bg-slate-200 w-0'
                      }`} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Students */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Choose students for the report:</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStudents}
                    >
                      {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {students.map(student => (
                      <div
                        key={student.Id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStudents.includes(student.Id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => handleStudentToggle(student.Id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{student.name}</p>
                            <p className="text-sm text-slate-600">Grade Average: {Math.round(student.gradeAverage || 0)}%</p>
                          </div>
                          {selectedStudents.includes(student.Id) && (
                            <ApperIcon name="CheckCircle" className="text-primary-500" size={20} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <p className="text-sm text-slate-600">
                      {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </p>
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      disabled={selectedStudents.length === 0}
                    >
                      Continue
                      <ApperIcon name="ArrowRight" size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Configure Report */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Configure Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Report Type</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {reportTypes.map(type => (
                        <div
                          key={type.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedReportType === type.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedReportType(type.id)}
                        >
                          <h4 className="font-semibold text-slate-900">{type.name}</h4>
                          <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedReportType && (
                    <div>
                      <Label>Report Template</Label>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(template => (
                          <div
                            key={template.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedTemplate === template.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedTemplate(template.id)}
                          >
                            <h4 className="font-semibold text-slate-900">{template.name}</h4>
                            <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} disabled={!selectedReportType || !selectedTemplate}>
                      Preview Report
                      <ApperIcon name="ArrowRight" size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Report Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Students:</span>
                        <p className="font-semibold">{selectedStudents.length}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Type:</span>
                        <p className="font-semibold">{reportTypes.find(t => t.id === selectedReportType)?.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Template:</span>
                        <p className="font-semibold">{templates.find(t => t.id === selectedTemplate)?.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Period:</span>
                        <p className="font-semibold">{format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 p-8 text-center">
                    <ApperIcon name="FileText" className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">Report Preview</h4>
                    <p className="text-slate-600 mb-4">
                      Your report will include detailed information for {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} 
                      using the {templates.find(t => t.id === selectedTemplate)?.name} template.
                    </p>
                    <Badge variant="secondary">
                      Ready to generate
                    </Badge>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleGenerateReport} disabled={loading}>
                      {loading && <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />}
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Export & Share */}
        {currentStep === 4 && generatedReport && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-success-600 flex items-center">
                    <ApperIcon name="CheckCircle" size={24} className="mr-2" />
                    Report Generated Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-slate-600">
                      Your report has been generated for {generatedReport.reports.length} student{generatedReport.reports.length !== 1 ? 's' : ''}.
                      Choose how you'd like to export or share the report.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <Button onClick={() => handleExportReport('pdf')} disabled={loading}>
                        <ApperIcon name="FileDown" size={16} className="mr-2" />
                        Export as PDF
                      </Button>
                      <Button variant="outline" onClick={() => handleExportReport('excel')} disabled={loading}>
                        <ApperIcon name="FileSpreadsheet" size={16} className="mr-2" />
                        Export as Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emailRecipients">Recipients (comma separated)</Label>
                      <Input
                        id="emailRecipients"
                        placeholder="parent1@email.com, parent2@email.com"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailSubject">Subject (optional)</Label>
                      <Input
                        id="emailSubject"
                        placeholder="Student Progress Report"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailMessage">Message (optional)</Label>
                      <textarea
                        id="emailMessage"
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md resize-none"
                        rows={3}
                        placeholder="Please find attached your child's progress report..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleEmailReport} disabled={loading || !emailRecipients.trim()}>
                      {loading && <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />}
                      <ApperIcon name="Mail" size={16} className="mr-2" />
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button variant="outline" onClick={resetForm}>
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  Generate New Report
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReportsPage;