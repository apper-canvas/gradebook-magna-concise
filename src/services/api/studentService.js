import studentsData from "@/services/mockData/students.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class StudentService {
  constructor() {
    this.students = [...studentsData];
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

    // Recalculate grade average
    const totalPoints = student.grades.reduce((sum, grade) => sum + grade.score, 0);
    const totalPossible = student.grades.reduce((sum, grade) => sum + grade.maxScore, 0);
    student.gradeAverage = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;

    // Update recent assignment score
    const mostRecentGrade = student.grades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    student.recentAssignmentScore = mostRecentGrade ? (mostRecentGrade.score / mostRecentGrade.maxScore) * 100 : 0;

    return {
      ...student,
      grades: [...student.grades]
    };
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

    // Recalculate grade average
    if (student.grades.length > 0) {
      const totalPoints = student.grades.reduce((sum, grade) => sum + grade.score, 0);
      const totalPossible = student.grades.reduce((sum, grade) => sum + grade.maxScore, 0);
      student.gradeAverage = (totalPoints / totalPossible) * 100;

      // Update recent assignment score
      const mostRecentGrade = student.grades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      student.recentAssignmentScore = (mostRecentGrade.score / mostRecentGrade.maxScore) * 100;
    } else {
      student.gradeAverage = 0;
      student.recentAssignmentScore = 0;
    }

    return { ...student };
  }
}

export const studentService = new StudentService();