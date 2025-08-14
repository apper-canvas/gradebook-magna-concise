import { studentService } from '@/services/api/studentService';
import { classService } from '@/services/api/classService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ReportsService {
  constructor() {
    this.reportTypes = [
      { id: 'progress', name: 'Progress Report', description: 'Comprehensive grade and academic progress summary' },
      { id: 'attendance', name: 'Attendance Report', description: 'Attendance patterns and statistics' },
      { id: 'behavior', name: 'Behavior Report', description: 'Behavioral observations and notes' }
    ];
    
    this.templates = {
      'grade-summary': {
        id: 'grade-summary',
        name: 'Grade Summary',
        description: 'Current grades with category breakdowns',
        supportedTypes: ['progress']
      },
      'attendance-patterns': {
        id: 'attendance-patterns',
        name: 'Attendance Patterns',
        description: 'Attendance trends and statistics',
        supportedTypes: ['attendance']
      },
      'recent-assignments': {
        id: 'recent-assignments',
        name: 'Recent Assignments',
        description: 'Latest assignment scores and feedback',
        supportedTypes: ['progress']
      },
      'teacher-comments': {
        id: 'teacher-comments',
        name: 'Teacher Comments',
        description: 'Behavioral observations and notes',
        supportedTypes: ['behavior', 'progress']
      }
    };
  }

  async getReportTypes() {
    await delay(200);
    return [...this.reportTypes];
  }

  async getTemplates(reportType = null) {
    await delay(200);
    if (reportType) {
      return Object.values(this.templates).filter(template => 
        template.supportedTypes.includes(reportType)
      );
    }
    return Object.values(this.templates);
  }

  async generateReport(config) {
    await delay(1000);
    
    const { studentIds, startDate, endDate, reportType, templateId } = config;
    
    if (!studentIds || studentIds.length === 0) {
      throw new Error('At least one student must be selected');
    }

    const reports = [];
    
    for (const studentId of studentIds) {
      try {
        const student = await studentService.getById(studentId);
        const reportData = await this.generateStudentReport(student, config);
        reports.push(reportData);
      } catch (error) {
        console.error(`Error generating report for student ${studentId}:`, error);
      }
    }

    return {
      id: Date.now().toString(),
      config,
      reports,
      generatedAt: new Date().toISOString(),
      status: 'completed'
    };
  }

  async generateStudentReport(student, config) {
    const { startDate, endDate, reportType, templateId } = config;
    
    const reportData = {
      studentId: student.Id,
      studentName: student.name,
      reportType,
      templateId,
      generatedAt: new Date().toISOString(),
      data: {}
    };

    switch (templateId) {
      case 'grade-summary':
        reportData.data = await this.generateGradeSummaryData(student, startDate, endDate);
        break;
      case 'attendance-patterns':
        reportData.data = await this.generateAttendancePatternsData(student, startDate, endDate);
        break;
      case 'recent-assignments':
        reportData.data = await this.generateRecentAssignmentsData(student, startDate, endDate);
        break;
      case 'teacher-comments':
        reportData.data = await this.generateTeacherCommentsData(student, startDate, endDate);
        break;
      default:
        throw new Error(`Unknown template: ${templateId}`);
    }

    return reportData;
  }

  async generateGradeSummaryData(student, startDate, endDate) {
    const categoryBreakdown = studentService.getCategoryBreakdown(student.Id);
    const currentClass = await classService.getActive();
    
    // Filter grades within date range
    const filteredGrades = student.grades.filter(grade => {
      const gradeDate = new Date(grade.date);
      return gradeDate >= new Date(startDate) && gradeDate <= new Date(endDate);
    });

    return {
      currentGrade: student.gradeAverage || 0,
      totalAssignments: filteredGrades.length,
      categoryBreakdown,
      recentTrend: this.calculateGradeTrend(filteredGrades),
      className: currentClass?.name || 'Current Class',
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  async generateAttendancePatternsData(student, startDate, endDate) {
    const attendanceHistory = await studentService.getStudentAttendanceHistory(student.Id);
    
    // Filter attendance within date range
    const filteredHistory = {};
    Object.entries(attendanceHistory.history).forEach(([date, status]) => {
      const attendanceDate = new Date(date);
      if (attendanceDate >= new Date(startDate) && attendanceDate <= new Date(endDate)) {
        filteredHistory[date] = status;
      }
    });

    const totalDays = Object.keys(filteredHistory).length;
    const presentDays = Object.values(filteredHistory).filter(status => 
      status === 'Present' || status === 'Late' || status === 'Excused'
    ).length;

    return {
      attendancePercentage: student.attendancePercentage || 95,
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays,
      lateCount: Object.values(filteredHistory).filter(status => status === 'Late').length,
      excusedCount: Object.values(filteredHistory).filter(status => status === 'Excused').length,
      attendanceHistory: filteredHistory,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  async generateRecentAssignmentsData(student, startDate, endDate) {
    // Filter and sort recent assignments
    const recentGrades = student.grades
      .filter(grade => {
        const gradeDate = new Date(grade.date);
        return gradeDate >= new Date(startDate) && gradeDate <= new Date(endDate);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); // Last 10 assignments

    return {
      assignments: recentGrades.map(grade => ({
        name: grade.assignmentName,
        score: grade.score,
        maxScore: grade.maxScore,
        percentage: Math.round((grade.score / grade.maxScore) * 100),
        date: grade.date,
        category: grade.category
      })),
      averageScore: recentGrades.length > 0 ? 
        Math.round(recentGrades.reduce((sum, grade) => 
          sum + (grade.score / grade.maxScore) * 100, 0) / recentGrades.length) : 0,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  async generateTeacherCommentsData(student, startDate, endDate) {
    return {
      generalNotes: student.notes || 'No specific notes recorded for this period.',
      behaviorObservations: [
        'Consistently participates in class discussions',
        'Shows good collaboration skills with peers',
        'Demonstrates strong work ethic'
      ],
      recommendations: [
        'Continue current study habits',
        'Consider additional practice in challenging areas',
        'Maintain consistent attendance'
      ],
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  calculateGradeTrend(grades) {
    if (grades.length < 2) return 'stable';
    
    const sortedGrades = grades.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstHalf = sortedGrades.slice(0, Math.ceil(sortedGrades.length / 2));
    const secondHalf = sortedGrades.slice(Math.ceil(sortedGrades.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  async exportReport(reportData, format = 'pdf') {
    await delay(500);
    
    // Simulate export process
    const exportId = Date.now().toString();
    
    return {
      exportId,
      format,
      downloadUrl: `#download-${exportId}`,
      filename: `report-${reportData.config.reportType}-${format}-${exportId}.${format}`
    };
  }

  async emailReport(reportData, emailConfig) {
    await delay(800);
    
    const { recipients, subject, message } = emailConfig;
    
    if (!recipients || recipients.length === 0) {
      throw new Error('At least one recipient email is required');
    }

    return {
      emailId: Date.now().toString(),
      recipients,
      subject: subject || `Student Report - ${reportData.config.reportType}`,
      status: 'sent',
      sentAt: new Date().toISOString()
    };
  }
}

export const reportsService = new ReportsService();
export default reportsService;