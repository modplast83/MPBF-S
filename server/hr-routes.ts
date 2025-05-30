import type { Express } from "express";
import { hrStorage } from "./hr-storage";

export function setupHRRoutes(app: Express) {
  // Time Attendance endpoints
  app.get("/api/hr/time-attendance", async (req, res) => {
    try {
      const attendance = await hrStorage.getTimeAttendance();
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/hr/time-attendance", async (req, res) => {
    try {
      const attendance = await hrStorage.createTimeAttendance(req.body);
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
      
      const attendance = await hrStorage.updateTimeAttendance(id, req.body);
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
      const employees = await hrStorage.getEmployeeOfMonth();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employee of month:", error);
      res.status(500).json({ error: "Failed to fetch employee records" });
    }
  });

  app.post("/api/hr/employee-of-month", async (req, res) => {
    try {
      const employee = await hrStorage.createEmployeeOfMonth(req.body);
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee of month:", error);
      res.status(500).json({ error: "Failed to create employee record" });
    }
  });

  // HR Violations endpoints
  app.get("/api/hr/violations", async (req, res) => {
    try {
      const violations = await hrStorage.getHrViolations();
      res.json(violations);
    } catch (error) {
      console.error("Error fetching violations:", error);
      res.status(500).json({ error: "Failed to fetch violation records" });
    }
  });

  app.post("/api/hr/violations", async (req, res) => {
    try {
      const violation = await hrStorage.createHrViolation(req.body);
      res.json(violation);
    } catch (error) {
      console.error("Error creating violation:", error);
      res.status(500).json({ error: "Failed to create violation record" });
    }
  });

  // HR Complaints endpoints
  app.get("/api/hr/complaints", async (req, res) => {
    try {
      const complaints = await hrStorage.getHrComplaints();
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ error: "Failed to fetch complaint records" });
    }
  });

  app.post("/api/hr/complaints", async (req, res) => {
    try {
      const complaint = await hrStorage.createHrComplaint(req.body);
      res.json(complaint);
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({ error: "Failed to create complaint record" });
    }
  });

  // Users endpoint for HR module
  app.get("/api/hr/users", async (req, res) => {
    try {
      const users = await hrStorage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
}