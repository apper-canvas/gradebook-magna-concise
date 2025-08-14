import studentsData from "@/services/mockData/students.json";

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
    // Initialize attendance tracking
    this.attendance = new Map(); // Map<string, Map<number, string>> - date -> studentId -> status
  }

  // Get category weights configuration
  getCategoryWeights() {
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

  async getAll() {
    await delay(300);
    return this.students.map(student => ({
      ...student,
      grades: [...student.grades]
    }));
  }

  async getById(id) {
    await delay(200);
    const student = this.students.find(s => s.Id === parseInt(id));
    if (!student) {
      throw new Error("Student not found");
    }
    return {
      ...student,
      grades: [...student.grades]
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
      category: gradeData.category
    };

    student.grades.push(newGrade);

    // Recalculate weighted grade average
    student.gradeAverage = this.calculateWeightedGrade(student.grades);

    // Update recent assignment score
    const mostRecentGrade = student.grades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    student.recentAssignmentScore = mostRecentGrade ? (mostRecentGrade.score / mostRecentGrade.maxScore) * 100 : 0;

    return {
      ...student,
      grades: [...student.grades]
    };
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

    // Count attendance across all dates
    for (const [date, dayAttendance] of this.attendance.entries()) {
      const status = dayAttendance.get(studentId);
      if (status) {
        totalDays++;
        if (status === "Present" || status === "Late") {
          presentDays++;
        }
      }
    }

    return totalDays > 0 ? (presentDays / totalDays) * 100 : 95; // Default to 95% if no records
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
return { ...student };
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
}
export const studentService = new StudentService();