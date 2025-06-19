import type { Express } from "express";
import { storage } from "./storage";

export function setupHRRoutes(app: Express) {
  // Employee Ranks
  app.get("/api/hr/employee-ranks", async (req, res) => {
    try {
      const ranks = await storage.getEmployeeRanks();
      res.json(ranks);
    } catch (error) {
      console.error("Error fetching employee ranks:", error);
      res.status(500).json({ error: "Failed to fetch employee ranks" });
    }
  });

  app.post("/api/hr/employee-ranks", async (req, res) => {
    try {
      const rank = await storage.createEmployeeRank(req.body);
      res.json(rank);
    } catch (error) {
      console.error("Error creating employee rank:", error);
      res.status(500).json({ error: "Failed to create employee rank" });
    }
  });

  app.put("/api/hr/employee-ranks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rank = await storage.updateEmployeeRank(id, req.body);
      if (!rank) {
        return res.status(404).json({ error: "Employee rank not found" });
      }
      res.json(rank);
    } catch (error) {
      console.error("Error updating employee rank:", error);
      res.status(500).json({ error: "Failed to update employee rank" });
    }
  });

  app.delete("/api/hr/employee-ranks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployeeRank(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting employee rank:", error);
      res.status(500).json({ error: "Failed to delete employee rank" });
    }
  });

  // Employee profile data is now integrated into users - use /api/users endpoints instead

  // Geofences
  app.get("/api/hr/geofences", async (req, res) => {
    try {
      const geofences = await storage.getGeofences();
      res.json(geofences);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      res.status(500).json({ error: "Failed to fetch geofences" });
    }
  });

  app.post("/api/hr/geofences", async (req, res) => {
    try {
      const geofence = await storage.createGeofence(req.body);
      res.json(geofence);
    } catch (error) {
      console.error("Error creating geofence:", error);
      res.status(500).json({ error: "Failed to create geofence" });
    }
  });

  app.put("/api/hr/geofences/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const geofence = await storage.updateGeofence(id, req.body);
      if (!geofence) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.json(geofence);
    } catch (error) {
      console.error("Error updating geofence:", error);
      res.status(500).json({ error: "Failed to update geofence" });
    }
  });

  // Geofence checking endpoint
  app.post("/api/hr/check-geofence", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const geofences = await storage.checkUserInGeofence(latitude, longitude);
      res.json(geofences);
    } catch (error) {
      console.error("Error checking geofence:", error);
      res.status(500).json({ error: "Failed to check geofence" });
    }
  });

  // Leave Requests
  app.get("/api/hr/leave-requests", async (req, res) => {
    try {
      const { userId, status } = req.query;
      let requests;
      
      if (userId) {
        requests = await storage.getLeaveRequestsByUser(userId as string);
      } else if (status) {
        requests = await storage.getLeaveRequestsByStatus(status as string);
      } else {
        requests = await storage.getLeaveRequests();
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ error: "Failed to fetch leave requests" });
    }
  });

  app.post("/api/hr/leave-requests", async (req, res) => {
    try {
      const request = await storage.createLeaveRequest(req.body);
      res.json(request);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ error: "Failed to create leave request" });
    }
  });

  app.put("/api/hr/leave-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateLeaveRequest(id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Leave request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error updating leave request:", error);
      res.status(500).json({ error: "Failed to update leave request" });
    }
  });

  // Overtime Requests
  app.get("/api/hr/overtime-requests", async (req, res) => {
    try {
      const { userId, status } = req.query;
      let requests;
      
      if (userId) {
        requests = await storage.getOvertimeRequestsByUser(userId as string);
      } else if (status) {
        requests = await storage.getOvertimeRequestsByStatus(status as string);
      } else {
        requests = await storage.getOvertimeRequests();
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching overtime requests:", error);
      res.status(500).json({ error: "Failed to fetch overtime requests" });
    }
  });

  app.post("/api/hr/overtime-requests", async (req, res) => {
    try {
      const request = await storage.createOvertimeRequest(req.body);
      res.json(request);
    } catch (error) {
      console.error("Error creating overtime request:", error);
      res.status(500).json({ error: "Failed to create overtime request" });
    }
  });

  app.put("/api/hr/overtime-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateOvertimeRequest(id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Overtime request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error updating overtime request:", error);
      res.status(500).json({ error: "Failed to update overtime request" });
    }
  });

  // Overtime analysis
  app.get("/api/hr/overtime-analysis/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ error: "Year and month are required" });
      }
      
      const analysis = await storage.getMonthlyOvertimeByUser(
        userId, 
        parseInt(year as string), 
        parseInt(month as string)
      );
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching overtime analysis:", error);
      res.status(500).json({ error: "Failed to fetch overtime analysis" });
    }
  });

  // Payroll Records
  app.get("/api/hr/payroll-records", async (req, res) => {
    try {
      const { userId, status } = req.query;
      let records;
      
      if (userId) {
        records = await storage.getPayrollRecordsByUser(userId as string);
      } else if (status) {
        records = await storage.getPayrollRecordsByStatus(status as string);
      } else {
        records = await storage.getPayrollRecords();
      }
      
      res.json(records);
    } catch (error) {
      console.error("Error fetching payroll records:", error);
      res.status(500).json({ error: "Failed to fetch payroll records" });
    }
  });

  app.post("/api/hr/payroll-records", async (req, res) => {
    try {
      const record = await storage.createPayrollRecord(req.body);
      res.json(record);
    } catch (error) {
      console.error("Error creating payroll record:", error);
      res.status(500).json({ error: "Failed to create payroll record" });
    }
  });

  app.put("/api/hr/payroll-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.updatePayrollRecord(id, req.body);
      if (!record) {
        return res.status(404).json({ error: "Payroll record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error updating payroll record:", error);
      res.status(500).json({ error: "Failed to update payroll record" });
    }
  });

  // Performance Reviews
  app.get("/api/hr/performance-reviews", async (req, res) => {
    try {
      const { userId, reviewerId } = req.query;
      let reviews;
      
      if (userId) {
        reviews = await storage.getPerformanceReviewsByUser(userId as string);
      } else if (reviewerId) {
        reviews = await storage.getPerformanceReviewsByReviewer(reviewerId as string);
      } else {
        reviews = await storage.getPerformanceReviews();
      }
      
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      res.status(500).json({ error: "Failed to fetch performance reviews" });
    }
  });

  app.post("/api/hr/performance-reviews", async (req, res) => {
    try {
      const review = await storage.createPerformanceReview(req.body);
      res.json(review);
    } catch (error) {
      console.error("Error creating performance review:", error);
      res.status(500).json({ error: "Failed to create performance review" });
    }
  });

  app.put("/api/hr/performance-reviews/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.updatePerformanceReview(id, req.body);
      if (!review) {
        return res.status(404).json({ error: "Performance review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating performance review:", error);
      res.status(500).json({ error: "Failed to update performance review" });
    }
  });

  // Enhanced Time Attendance with geofencing and overtime validation
  app.post("/api/hr/check-in", async (req, res) => {
    try {
      const { userId, latitude, longitude } = req.body;
      
      // Check if user is within geofence
      const geofences = await storage.checkUserInGeofence(latitude, longitude);
      if (geofences.length === 0) {
        return res.status(400).json({ error: "You are not within the factory area" });
      }
      
      // Check if already checked in today
      const today = new Date();
      const existingAttendance = await storage.getTimeAttendanceByUserAndDate(userId, today);
      if (existingAttendance && existingAttendance.checkInTime) {
        return res.status(400).json({ error: "Already checked in today" });
      }
      
      // Create or update attendance record
      const attendanceData = {
        userId,
        date: today,
        checkInTime: new Date(),
        checkInLocation: `${latitude},${longitude}`,
        status: 'present'
      };
      
      let attendance;
      if (existingAttendance) {
        attendance = await storage.updateTimeAttendance(existingAttendance.id, attendanceData);
      } else {
        attendance = await storage.createTimeAttendance(attendanceData);
      }
      
      res.json(attendance);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  app.post("/api/hr/check-out", async (req, res) => {
    try {
      const { userId, latitude, longitude, isAutomatic = false } = req.body;
      
      // Get today's attendance record
      const today = new Date();
      const attendance = await storage.getTimeAttendanceByUserAndDate(userId, today);
      if (!attendance || !attendance.checkInTime) {
        return res.status(400).json({ error: "No check-in record found for today" });
      }
      
      if (attendance.checkOutTime) {
        return res.status(400).json({ error: "Already checked out today" });
      }
      
      // Calculate working hours
      const checkOutTime = new Date();
      const workingHours = (checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate break duration if breaks were taken
      let breakDuration = 0;
      if (attendance.breakStartTime && attendance.breakEndTime) {
        breakDuration = (attendance.breakEndTime.getTime() - attendance.breakStartTime.getTime()) / (1000 * 60 * 60);
      }
      
      const netWorkingHours = workingHours - breakDuration;
      const standardWorkingHours = 8; // configurable
      const overtimeHours = Math.max(0, netWorkingHours - standardWorkingHours);
      
      const updateData = {
        checkOutTime,
        checkOutLocation: latitude && longitude ? `${latitude},${longitude}` : null,
        workingHours: netWorkingHours,
        overtimeHours,
        breakDuration,
        isAutoCheckedOut: isAutomatic,
        autoCheckOutReason: isAutomatic ? "Left factory area" : null
      };
      
      const updatedAttendance = await storage.updateTimeAttendance(attendance.id, updateData);
      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  // Legacy HR endpoints for existing functionality
  app.get("/api/hr/time-attendance", async (req, res) => {
    try {
      const attendance = await storage.getAllTimeAttendance();
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/hr/time-attendance", async (req, res) => {
    try {
      const attendance = await storage.createTimeAttendance(req.body);
      res.json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });

  app.put("/api/hr/time-attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid attendance ID" });
      }
      
      const attendance = await storage.updateTimeAttendance(id, req.body);
      if (!attendance) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ error: "Failed to update attendance record" });
    }
  });

  // Employee of Month endpoints
  app.get("/api/hr/employee-of-month", async (req, res) => {
    try {
      const employees = await storage.getEmployeeOfMonth();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employee of month:", error);
      res.status(500).json({ error: "Failed to fetch employee records" });
    }
  });

  app.post("/api/hr/employee-of-month", async (req, res) => {
    try {
      const employee = await storage.createEmployeeOfMonth(req.body);
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee of month:", error);
      res.status(500).json({ error: "Failed to create employee record" });
    }
  });

  // HR Violations endpoints
  app.get("/api/hr/violations", async (req, res) => {
    try {
      const violations = await storage.getHrViolations();
      res.json(violations);
    } catch (error) {
      console.error("Error fetching violations:", error);
      res.status(500).json({ error: "Failed to fetch violation records" });
    }
  });

  app.post("/api/hr/violations", async (req, res) => {
    try {
      const violation = await storage.createHrViolation(req.body);
      res.json(violation);
    } catch (error) {
      console.error("Error creating violation:", error);
      res.status(500).json({ error: "Failed to create violation record" });
    }
  });
}