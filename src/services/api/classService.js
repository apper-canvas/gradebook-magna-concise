import classesData from '@/services/mockData/classes.json';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ClassService {
  constructor() {
    this.classes = [...classesData];
    this.nextId = Math.max(...this.classes.map(c => c.Id)) + 1;
  }

  async getAll() {
    await delay(300);
    return this.classes.map(classItem => ({ ...classItem }));
  }

  async getById(id) {
    await delay(200);
    const classItem = this.classes.find(c => c.Id === parseInt(id));
    if (!classItem) {
      throw new Error('Class not found');
    }
    return { ...classItem };
  }

  async getActive() {
    await delay(200);
    const activeClass = this.classes.find(c => c.isActive);
    return activeClass ? { ...activeClass } : null;
  }

  async setActive(id) {
    await delay(200);
    // Set all classes to inactive
    this.classes = this.classes.map(c => ({ ...c, isActive: false }));
    
    // Set the specified class to active
    const classIndex = this.classes.findIndex(c => c.Id === parseInt(id));
    if (classIndex === -1) {
      throw new Error('Class not found');
    }
    
    this.classes[classIndex].isActive = true;
    return { ...this.classes[classIndex] };
  }

  async create(classData) {
    await delay(400);
    
    const newClass = {
      Id: this.nextId++,
      name: classData.name,
      subject: classData.subject,
      period: classData.period,
      startTime: classData.startTime,
      endTime: classData.endTime,
      room: classData.room,
      enrolledCount: 0,
      isActive: this.classes.length === 0, // First class is active
      color: classData.color || 'primary',
      createdAt: new Date().toISOString()
    };

    this.classes.push(newClass);
    return { ...newClass };
  }

  async update(id, updateData) {
    await delay(400);
    
    const classIndex = this.classes.findIndex(c => c.Id === parseInt(id));
    if (classIndex === -1) {
      throw new Error('Class not found');
    }

    this.classes[classIndex] = {
      ...this.classes[classIndex],
      ...updateData,
      Id: parseInt(id) // Preserve ID
    };

    return { ...this.classes[classIndex] };
  }

  async delete(id) {
    await delay(300);
    
    const classIndex = this.classes.findIndex(c => c.Id === parseInt(id));
    if (classIndex === -1) {
      throw new Error('Class not found');
    }

    const deletedClass = this.classes[classIndex];
    this.classes.splice(classIndex, 1);

    // If deleted class was active, make first remaining class active
    if (deletedClass.isActive && this.classes.length > 0) {
      this.classes[0].isActive = true;
    }

    return { ...deletedClass };
  }

  async getClassStats(classId) {
    await delay(200);
    const classItem = this.classes.find(c => c.Id === parseInt(classId));
    if (!classItem) {
      throw new Error('Class not found');
    }

    // Mock stats - in real app would calculate from student data
    return {
      enrolledCount: classItem.enrolledCount,
      averageGrade: Math.round(85 + Math.random() * 10),
      attendanceRate: Math.round(92 + Math.random() * 6),
      recentAssignments: Math.floor(Math.random() * 5) + 1,
      upcomingTests: Math.floor(Math.random() * 3)
    };
  }
}

export const classService = new ClassService();