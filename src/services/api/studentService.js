import studentsData from "@/services/mockData/students_updated.json";

// Category weights configuration (percentages that must sum to 100)
const CATEGORY_WEIGHTS = {
  'Test': 35,        // 35%
  'Quiz': 20,        // 20%
  'Homework': 20,    // 20%
  'Project': 15,     // 15%
  'Participation': 10 // 10%
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class StudentService {
  constructor() {
    this.students = [...studentsData];
    this.categoryWeights = CATEGORY_WEIGHTS;
    this.currentClassId = 1; // Default to first class
    // Initialize attendance tracking
    this.attendance = new Map(); // Map<string, Map<number, string>> - date -> studentId -> status
  }
// Get category weights configuration
  getCategoryWeights() {
    return { ...this.categoryWeights };
  }

  setCategoryWeights(newWeights) {
    this.categoryWeights = { ...newWeights };
    return { ...this.categoryWeights };
  }
  // Calculate weighted grade average for a student
  calculateWeightedGrade(grades) {
    if (!grades || grades.length === 0) return 0;

    // Group grades by category
    const gradesByCategory = {};
    grades.forEach(grade => {
      const category = grade.category || 'Assignment';
      if (!gradesByCategory[category]) {
        gradesByCategory[category] = [];
      }
      gradesByCategory[category].push(grade);
    });

    // Calculate category averages
    const categoryAverages = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    Object.entries(gradesByCategory).forEach(([category, categoryGrades]) => {
      const categoryTotal = categoryGrades.reduce((sum, grade) => sum + grade.score, 0);
      const categoryPossible = categoryGrades.reduce((sum, grade) => sum + grade.maxScore, 0);
      const categoryAverage = categoryPossible > 0 ? (categoryTotal / categoryPossible) * 100 : 0;
      
      categoryAverages[category] = {
        average: categoryAverage,
        count: categoryGrades.length,
        totalPoints: categoryTotal,
        totalPossible: categoryPossible
      };

      // Apply weight if category exists in weights config
      const weight = this.categoryWeights[category] || 0;
      if (weight > 0) {
        totalWeightedScore += categoryAverage * (weight / 100);
        totalWeight += weight;
      }
    });

    // If no weighted categories exist, fall back to simple average
    if (totalWeight === 0) {
      const totalPoints = grades.reduce((sum, grade) => sum + grade.score, 0);
      const totalPossible = grades.reduce((sum, grade) => sum + grade.maxScore, 0);
      return totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;
    }

    // Normalize the weighted score if not all categories are present
    return totalWeight > 0 ? (totalWeightedScore * 100) / totalWeight : 0;
  }

  // Get category breakdown for a student
  getCategoryBreakdown(studentId) {
    const student = this.students.find(s => s.Id === parseInt(studentId));
    if (!student || !student.grades) return {};

    const gradesByCategory = {};
    student.grades.forEach(grade => {
      const category = grade.category || 'Assignment';
      if (!gradesByCategory[category]) {
        gradesByCategory[category] = [];
      }
      gradesByCategory[category].push(grade);
    });

    const breakdown = {};
    Object.entries(gradesByCategory).forEach(([category, grades]) => {
      const totalPoints = grades.reduce((sum, grade) => sum + grade.score, 0);
      const totalPossible = grades.reduce((sum, grade) => sum + grade.maxScore, 0);
      const average = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;
      const weight = this.categoryWeights[category] || 0;

      breakdown[category] = {
        average: average,
        weight: weight,
        count: grades.length,
        totalPoints: totalPoints,
        totalPossible: totalPossible,
        grades: grades.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });

    return breakdown;
  }
async getAll(classId = null) {
    await delay(300);
    const targetClassId = classId || this.currentClassId;
    
    // Filter students who are assigned to this class and their class-specific grades
    return this.students
      .filter(student => 
        !student.classes || 
        student.classes.length === 0 || 
        student.classes.includes(targetClassId)
      )
      .map(student => {
        const classGrades = student.grades.filter(grade => 
          grade.classId === targetClassId || !grade.classId // Include grades without classId for backward compatibility
        );
        
        // Recalculate grade average for this class only
        const classGradeAverage = this.calculateWeightedGrade(classGrades);
        
        return {
          ...student,
          grades: [...classGrades],
          gradeAverage: classGradeAverage,
          recentAssignmentScore: classGrades.length > 0 ? 
            (() => {
              const mostRecent = classGrades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
              return mostRecent ? (mostRecent.score / mostRecent.maxScore) * 100 : 0;
            })() : 0
        };
      });
  }

async getCurrentClass() {
    return this.currentClassId;
  }

  async setCurrentClass(classId) {
    this.currentClassId = parseInt(classId);
    return this.currentClassId;
  }

  async getStudentsForCurrentClass() {
    return this.getAll(this.currentClassId);
  }

async getById(id, classId = null) {
    await delay(200);
    const student = this.students.find(s => s.Id === parseInt(id));
    if (!student) {
      throw new Error("Student not found");
    }
    
    const targetClassId = classId || this.currentClassId;
    const classGrades = student.grades.filter(grade => 
      grade.classId === targetClassId || !grade.classId
    );
    
    // Recalculate grade average for this class only
    const classGradeAverage = this.calculateWeightedGrade(classGrades);
    
    return {
      ...student,
      grades: [...classGrades],
      gradeAverage: classGradeAverage
    };
  }
async addGrade(studentId, gradeData) {
    await delay(250);
    const studentIndex = this.students.findIndex(s => s.Id === parseInt(studentId));
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    const student = this.students[studentIndex];
    const highestGradeId = Math.max(
      0,
      ...this.students.flatMap(s => s.grades.map(g => g.Id))
    );

    const newGrade = {
      Id: highestGradeId + 1,
      studentId: studentId.toString(),
      assignmentName: gradeData.assignmentName,
      score: gradeData.score,
      maxScore: gradeData.maxScore,
      date: gradeData.date,
      category: gradeData.category,
      classId: this.currentClassId // Assign to current active class
    };

    student.grades.push(newGrade);

    // Return student data filtered for current class
    return this.getById(studentId, this.currentClassId);
  }

async getAttendanceForDate(date) {
    await delay(150);
    return this.attendance.get(date) || {};
  }

  async updateStudentAttendance(studentId, date, status) {
    await delay(200);
    const studentIndex = this.students.findIndex(s => s.Id === parseInt(studentId));
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    // Update attendance record
    if (!this.attendance.has(date)) {
      this.attendance.set(date, new Map());
    }
    this.attendance.get(date).set(parseInt(studentId), status);

    // Recalculate attendance percentage for the student
    const attendancePercentage = this.calculateAttendancePercentage(parseInt(studentId));
    this.students[studentIndex].attendancePercentage = attendancePercentage;

    return { ...this.students[studentIndex] };
  }

calculateAttendancePercentage(studentId) {
    let totalDays = 0;
    let presentDays = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    // Count attendance across all dates with detailed tracking
    for (const [date, dayAttendance] of this.attendance.entries()) {
      const status = dayAttendance.get(studentId);
      if (status) {
        totalDays++;
        switch (status) {
          case "Present":
            presentDays++;
            break;
          case "Late":
            presentDays++; // Late counts as present but track separately
            lateCount++;
            break;
          case "Absent":
            absentCount++;
            break;
          case "Excused":
            excusedCount++;
            presentDays++; // Excused counts as present
            break;
        }
      }
    }

    // Calculate running percentage with weighted consideration for late arrivals
    const basePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 95;
    
    // Apply slight penalty for excessive late arrivals (more than 20% of total days)
    const latePenalty = lateCount > (totalDays * 0.2) ? Math.min(lateCount * 0.5, 5) : 0;
    
    const finalPercentage = Math.max(0, Math.min(100, basePercentage - latePenalty));
    
    return Math.round(finalPercentage * 10) / 10; // Round to 1 decimal place
  }
async getStudentAttendanceHistory(studentId) {
    await delay(200);
    const history = {};
    const stats = {
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      excusedDays: 0
    };
    
    // Get all attendance records for this student across all dates with running totals
    for (const [date, dayAttendance] of this.attendance.entries()) {
      const status = dayAttendance.get(parseInt(studentId));
      if (status) {
        history[date] = status;
        stats.totalDays++;
        
        // Update running statistics
        switch (status) {
          case "Present":
            stats.presentDays++;
            break;
          case "Late":
            stats.presentDays++;
            stats.lateDays++;
            break;
          case "Absent":
            stats.absentDays++;
            break;
          case "Excused":
            stats.presentDays++;
            stats.excusedDays++;
            break;
        }
      }
    }
    
    // Add running percentage calculation
    stats.runningPercentage = stats.totalDays > 0 ? 
      Math.round(((stats.presentDays / stats.totalDays) * 100) * 10) / 10 : 95;
    
    return { history, stats };
  }
  async updateAttendance(studentId, attendancePercentage) {
    await delay(200);
    const studentIndex = this.students.findIndex(s => s.Id === parseInt(studentId));
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    this.students[studentIndex].attendancePercentage = attendancePercentage;
    return { ...this.students[studentIndex] };
  }
  async deleteGrade(studentId, gradeId) {
    await delay(200);
    const studentIndex = this.students.findIndex(s => s.Id === parseInt(studentId));
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    const student = this.students[studentIndex];
student.grades = student.grades.filter(g => g.Id !== parseInt(gradeId));

    // Recalculate weighted grade average
    if (student.grades.length > 0) {
      student.gradeAverage = this.calculateWeightedGrade(student.grades);

      // Update recent assignment score
      const mostRecentGrade = student.grades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      student.recentAssignmentScore = (mostRecentGrade.score / mostRecentGrade.maxScore) * 100;
    } else {
      student.gradeAverage = 0;
student.recentAssignmentScore = 0;
    }
    return { ...student };
  }
  async updateStudentNotes(studentId, notes) {
    await delay(200);
    const studentIndex = this.students.findIndex(s => s.Id === parseInt(studentId));
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    this.students[studentIndex].notes = notes || "";
    return { ...this.students[studentIndex] };
  }

  async addBulkGrades(gradesArray) {
    await delay(500);
    
    const results = [];
    const errors = [];
    
    for (const gradeData of gradesArray) {
      try {
        const studentIndex = this.students.findIndex(s => s.Id === parseInt(gradeData.studentId));
        if (studentIndex === -1) {
          errors.push(`Student with ID ${gradeData.studentId} not found`);
          continue;
        }

        const student = this.students[studentIndex];
        const highestGradeId = Math.max(
          0,
          ...this.students.flatMap(s => s.grades.map(g => g.Id))
        );

        const newGrade = {
          Id: highestGradeId + 1 + results.length, // Ensure unique IDs
          studentId: gradeData.studentId.toString(),
          assignmentName: gradeData.assignmentName,
          score: gradeData.score,
          maxScore: gradeData.maxScore,
          date: gradeData.date,
          category: gradeData.category
        };

        student.grades.push(newGrade);

        // Recalculate weighted grade average
        student.gradeAverage = this.calculateWeightedGrade(student.grades);

        // Update recent assignment score
        const mostRecentGrade = student.grades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        student.recentAssignmentScore = mostRecentGrade ? (mostRecentGrade.score / mostRecentGrade.maxScore) * 100 : 0;

        results.push({
          studentId: gradeData.studentId,
          grade: newGrade,
          student: { ...student }
        });

      } catch (error) {
        errors.push(`Error adding grade for student ${gradeData.studentId}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Bulk grade operation completed with errors: ${errors.join('; ')}`);
}

    return results;
  }
  // Get grade trends data for charting
  getGradeTrends(studentId) {
    const student = this.students.find(s => s.Id === parseInt(studentId));
    if (!student || !student.grades) return [];

    // Sort grades by date and calculate trend data
    const sortedGrades = [...student.grades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningTotal = 0;
    return sortedGrades.map((grade, index) => {
      const percentage = (grade.score / grade.maxScore) * 100;
      runningTotal += percentage;
      const runningAverage = runningTotal / (index + 1);
      
      return {
        date: grade.date,
        assignmentName: grade.assignmentName,
        category: grade.category,
        score: grade.score,
        maxScore: grade.maxScore,
        percentage: Math.round(percentage * 10) / 10,
        runningAverage: Math.round(runningAverage * 10) / 10
};
    });
  }
  // Class assignment methods
  async assignStudentsToClass(studentIds, classId) {
    await delay(500); // Simulate API call
    
    try {
      // Validate inputs
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        throw new Error("Student IDs must be a non-empty array");
      }
      
      if (!classId || typeof classId !== 'number') {
        throw new Error("Valid class ID is required");
      }

      // Update students with new class assignment
      studentIds.forEach(studentId => {
        const studentIndex = this.students.findIndex(s => s.Id === studentId);
        if (studentIndex !== -1) {
          // Add classId to student's classes array (or create if doesn't exist)
          if (!this.students[studentIndex].classes) {
            this.students[studentIndex].classes = [];
          }
          
          // Check if student is already in this class
          if (!this.students[studentIndex].classes.includes(classId)) {
            this.students[studentIndex].classes.push(classId);
          }
        }
      });

      return {
        success: true,
        assignedCount: studentIds.length,
        classId
      };
    } catch (error) {
      throw new Error(`Failed to assign students to class: ${error.message}`);
    }
  }

  async unassignStudentsFromClass(studentIds, classId) {
    await delay(300);
    
    try {
      studentIds.forEach(studentId => {
        const studentIndex = this.students.findIndex(s => s.Id === studentId);
        if (studentIndex !== -1 && this.students[studentIndex].classes) {
          this.students[studentIndex].classes = this.students[studentIndex].classes.filter(
            id => id !== classId
          );
        }
      });

      return {
        success: true,
        unassignedCount: studentIds.length,
        classId
      };
    } catch (error) {
      throw new Error(`Failed to unassign students from class: ${error.message}`);
    }
  }

  async getStudentsByClass(classId) {
    await delay(200);
    
    if (classId) {
      return this.students.filter(student => 
        student.classes && student.classes.includes(classId)
      );
    }
    
    return [...this.students];
  }
// Report-specific data methods
  async getStudentSummaryForReport(studentId, startDate, endDate) {
    await delay(300);
    const student = await this.getById(studentId);
    const attendanceHistory = await this.getStudentAttendanceHistory(studentId);
    
    // Filter grades within date range
    const filteredGrades = student.grades.filter(grade => {
      const gradeDate = new Date(grade.date);
      return gradeDate >= new Date(startDate) && gradeDate <= new Date(endDate);
    });
    
    return {
      ...student,
      gradesInPeriod: filteredGrades,
      attendanceHistory: attendanceHistory,
      periodGradeAverage: this.calculateWeightedGrade(filteredGrades)
    };
  }

  async getAttendancePatternsForPeriod(studentId, startDate, endDate) {
    await delay(200);
    const attendanceHistory = await this.getStudentAttendanceHistory(studentId);
    
    // Filter attendance within date range
    const filteredHistory = {};
    Object.entries(attendanceHistory.history).forEach(([date, status]) => {
      const attendanceDate = new Date(date);
      if (attendanceDate >= new Date(startDate) && attendanceDate <= new Date(endDate)) {
        filteredHistory[date] = status;
      }
    });

    const totalDays = Object.keys(filteredHistory).length;
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    Object.values(filteredHistory).forEach(status => {
      switch (status.toLowerCase()) {
        case 'present':
          statusCounts.present++;
          break;
        case 'late':
          statusCounts.late++;
          break;
        case 'absent':
          statusCounts.absent++;
          break;
        case 'excused':
          statusCounts.excused++;
          break;
      }
    });

    const attendancePercentage = totalDays > 0 ? 
      Math.round(((statusCounts.present + statusCounts.late + statusCounts.excused) / totalDays) * 100) : 100;

    return {
      totalDays,
      attendancePercentage,
      statusCounts,
      filteredHistory,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  async getRecentAssignmentsForPeriod(studentId, startDate, endDate, limit = 10) {
    await delay(200);
    const student = await this.getById(studentId);
    
    const filteredGrades = student.grades
      .filter(grade => {
        const gradeDate = new Date(grade.date);
        return gradeDate >= new Date(startDate) && gradeDate <= new Date(endDate);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    return {
      assignments: filteredGrades,
      averageScore: filteredGrades.length > 0 ? 
        Math.round(filteredGrades.reduce((sum, grade) => 
          sum + (grade.score / grade.maxScore) * 100, 0) / filteredGrades.length) : 0,
      totalAssignments: filteredGrades.length
    };
  }

  async getBehaviorDataForPeriod(studentId, startDate, endDate) {
    await delay(200);
    const student = await this.getById(studentId);
    
    // In a real implementation, this would fetch behavior records
    // For now, we'll use the student notes and generate some sample data
    return {
      notes: student.notes || '',
      behaviorEvents: [
        {
          date: startDate,
          type: 'positive',
          description: 'Excellent participation in class discussion'
        },
        {
          date: endDate,
          type: 'neutral',
          description: 'Completed all assignments on time'
        }
      ],
      overallBehavior: 'positive'
    };
  }
}

export const studentService = new StudentService();