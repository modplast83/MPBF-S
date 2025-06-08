// Temporary in-memory storage for HR module to bypass database issues
export class HRStorage {
  private timeAttendance: any[] = [];
  private employeeOfMonth: any[] = [];
  private hrViolations: any[] = [];
  private hrComplaints: any[] = [];
  private currentId = 1;

  // Time Attendance methods
  async getTimeAttendance(): Promise<any[]> {
    return this.timeAttendance;
  }

  async getTimeAttendanceByUser(userId: string): Promise<any[]> {
    return this.timeAttendance.filter(att => att.userId === userId);
  }

  async getTimeAttendanceByDate(date: Date): Promise<any[]> {
    const dateStr = date.toISOString().split('T')[0];
    return this.timeAttendance.filter(att => {
      const attDate = new Date(att.date).toISOString().split('T')[0];
      return attDate === dateStr;
    });
  }

  async getTimeAttendanceByUserAndDate(userId: string, date: Date): Promise<any | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    return this.timeAttendance.find(att => {
      const attDate = new Date(att.date).toISOString().split('T')[0];
      return att.userId === userId && attDate === dateStr;
    });
  }

  async createTimeAttendance(attendance: any): Promise<any> {
    const newAttendance = { ...attendance, id: this.currentId++ };
    this.timeAttendance.push(newAttendance);
    return newAttendance;
  }

  async updateTimeAttendance(id: number, attendance: any): Promise<any | undefined> {
    const index = this.timeAttendance.findIndex(att => att.id === id);
    if (index !== -1) {
      this.timeAttendance[index] = { ...this.timeAttendance[index], ...attendance };
      return this.timeAttendance[index];
    }
    return undefined;
  }

  async deleteTimeAttendance(id: number): Promise<boolean> {
    const index = this.timeAttendance.findIndex(att => att.id === id);
    if (index !== -1) {
      this.timeAttendance.splice(index, 1);
      return true;
    }
    return false;
  }

  // Employee of Month methods
  async getEmployeeOfMonth(): Promise<any[]> {
    return this.employeeOfMonth;
  }

  async getEmployeeOfMonthByUser(userId: number): Promise<any[]> {
    return this.employeeOfMonth.filter(emp => emp.user_id === userId);
  }

  async createEmployeeOfMonth(employee: any): Promise<any> {
    const newEmployee = { ...employee, id: this.currentId++ };
    this.employeeOfMonth.push(newEmployee);
    return newEmployee;
  }

  async updateEmployeeOfMonth(id: number, employee: any): Promise<any | undefined> {
    const index = this.employeeOfMonth.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employeeOfMonth[index] = { ...this.employeeOfMonth[index], ...employee };
      return this.employeeOfMonth[index];
    }
    return undefined;
  }

  async deleteEmployeeOfMonth(id: number): Promise<boolean> {
    const index = this.employeeOfMonth.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employeeOfMonth.splice(index, 1);
      return true;
    }
    return false;
  }

  // HR Violations methods
  async getHrViolations(): Promise<any[]> {
    return this.hrViolations;
  }

  async getHrViolationsByUser(userId: number): Promise<any[]> {
    return this.hrViolations.filter(viol => viol.user_id === userId);
  }

  async createHrViolation(violation: any): Promise<any> {
    const newViolation = { ...violation, id: this.currentId++ };
    this.hrViolations.push(newViolation);
    return newViolation;
  }

  async updateHrViolation(id: number, violation: any): Promise<any | undefined> {
    const index = this.hrViolations.findIndex(viol => viol.id === id);
    if (index !== -1) {
      this.hrViolations[index] = { ...this.hrViolations[index], ...violation };
      return this.hrViolations[index];
    }
    return undefined;
  }

  async deleteHrViolation(id: number): Promise<boolean> {
    const index = this.hrViolations.findIndex(viol => viol.id === id);
    if (index !== -1) {
      this.hrViolations.splice(index, 1);
      return true;
    }
    return false;
  }

  // HR Complaints methods
  async getHrComplaints(): Promise<any[]> {
    return this.hrComplaints;
  }

  async getHrComplaintsByUser(userId: string): Promise<any[]> {
    return this.hrComplaints.filter(comp => comp.complainant_id === userId);
  }

  async createHrComplaint(complaint: any): Promise<any> {
    const newComplaint = { ...complaint, id: this.currentId++ };
    this.hrComplaints.push(newComplaint);
    return newComplaint;
  }

  async updateHrComplaint(id: number, complaint: any): Promise<any | undefined> {
    const index = this.hrComplaints.findIndex(comp => comp.id === id);
    if (index !== -1) {
      this.hrComplaints[index] = { ...this.hrComplaints[index], ...complaint };
      return this.hrComplaints[index];
    }
    return undefined;
  }

  async deleteHrComplaint(id: number): Promise<boolean> {
    const index = this.hrComplaints.findIndex(comp => comp.id === id);
    if (index !== -1) {
      this.hrComplaints.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get mock users for testing
  async getUsers(): Promise<any[]> {
    return [
      { id: 1, name: "Ahmed Hassan", username: "ahmed", department: "Production", position: "Manager" },
      { id: 2, name: "Fatima Al-Zahra", username: "fatima", department: "Quality", position: "Inspector" },
      { id: 3, name: "Omar Mahmoud", username: "omar", department: "Maintenance", position: "Technician" },
      { id: 4, name: "Layla Ibrahim", username: "layla", department: "HR", position: "Coordinator" },
      { id: 5, name: "Youssef Ahmed", username: "youssef", department: "Production", position: "Operator" }
    ];
  }
}

export const hrStorage = new HRStorage();