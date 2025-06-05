import { Express, Request, Response } from 'express';
import { requireAuth } from './auth-utils';
import { storage } from './storage';

export function setupMobileRoutes(app: Express) {
  // Get production metrics for mobile dashboard
  app.get('/api/production/metrics', requireAuth, async (req: Request, res: Response) => {
    try {
      const currentTime = new Date();
      const shiftStart = new Date(currentTime);
      shiftStart.setHours(8, 0, 0, 0); // Assume 8 AM shift start

      // Get active job orders count
      const allJobOrders = await storage.getJobOrders();
      const activeJobs = allJobOrders.filter(job => 
        job.status === 'in_progress' || job.status === 'started'
      ).length;

      // Calculate production metrics based on completed job orders today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedToday = allJobOrders.filter(job => {
        // Use receiveDate as a proxy for completion date since createdAt might not exist
        const completionDate = job.receiveDate ? new Date(job.receiveDate) : new Date();
        return completionDate >= today && job.status === 'completed';
      });

      const produced = completedToday.reduce((sum, job) => sum + (job.quantity || 0), 0);
      const target = 1000; // Daily target
      const efficiency = target > 0 ? Math.min((produced / target) * 100, 100) : 0;

      // Get pending tasks (maintenance requests)
      const maintenanceRequests = await storage.getMaintenanceRequests();
      const pendingTasks = maintenanceRequests.filter(req => req.status === 'pending').length;

      // Get alerts count (quality violations)
      const qualityViolations = await storage.getQualityViolations();
      const alerts = qualityViolations.filter(violation => violation.status === 'open').length;

      const metrics = {
        currentShift: {
          startTime: shiftStart.toISOString(),
          target,
          produced,
          efficiency: Math.round(efficiency * 100) / 100
        },
        activeJobs,
        pendingTasks,
        alerts
      };

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching production metrics:', error);
      res.status(500).json({ error: 'Failed to fetch production metrics' });
    }
  });

  // Start production action
  app.post('/api/production/start', requireAuth, async (req: Request, res: Response) => {
    try {
      const { timestamp, source } = req.body;
      
      // Log the action
      console.log(`Production started via ${source} at ${timestamp} by user ${req.user?.id}`);
      
      // Here you would typically update production status in the database
      // For now, we'll just return success
      
      res.json({ 
        success: true, 
        message: 'Production started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error starting production:', error);
      res.status(500).json({ error: 'Failed to start production' });
    }
  });

  // Pause production action
  app.post('/api/production/pause', requireAuth, async (req: Request, res: Response) => {
    try {
      const { timestamp, source } = req.body;
      
      console.log(`Production paused via ${source} at ${timestamp} by user ${req.user?.id}`);
      
      res.json({ 
        success: true, 
        message: 'Production paused successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error pausing production:', error);
      res.status(500).json({ error: 'Failed to pause production' });
    }
  });

  // Report issue action
  app.post('/api/issues', requireAuth, async (req: Request, res: Response) => {
    try {
      const { timestamp, source, description = 'Issue reported via gesture interface' } = req.body;
      
      console.log(`Issue reported via ${source} at ${timestamp} by user ${req.user?.id}`);
      console.log(`Description: ${description}`);
      
      res.json({ 
        success: true, 
        message: 'Issue reported successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error reporting issue:', error);
      res.status(500).json({ error: 'Failed to report issue' });
    }
  });

  // Mark task complete action
  app.post('/api/tasks/complete', requireAuth, async (req: Request, res: Response) => {
    try {
      const { timestamp, source, taskId } = req.body;
      
      console.log(`Task completion via ${source} at ${timestamp} by user ${req.user?.id}`);
      
      // If taskId is provided, update the specific task
      if (taskId) {
        // Update job order status or maintenance request
        // This would depend on your task system implementation
      }
      
      res.json({ 
        success: true, 
        message: 'Task marked as complete',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  });

  // Create quality check action
  app.post('/api/quality-checks', requireAuth, async (req: Request, res: Response) => {
    try {
      const { timestamp, source, rollId, jobOrderId } = req.body;
      
      // Create a quality check
      const qualityCheck = await storage.createQualityCheck({
        checkType: 'mobile_gesture',
        result: 'pending',
        notes: `Quality check initiated via ${source}`,
        rollId: rollId || null,
        jobOrderId: jobOrderId || null,
        checkedBy: req.user?.id || 'unknown'
      });

      console.log(`Quality check created via ${source} at ${timestamp} by user ${req.user?.id}`);
      
      res.json({ 
        success: true, 
        message: 'Quality check initiated',
        checkId: qualityCheck.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating quality check:', error);
      res.status(500).json({ error: 'Failed to create quality check' });
    }
  });

  // Reset machine action
  app.post('/api/machines/reset', requireAuth, async (req: Request, res: Response) => {
    try {
      const { timestamp, source, machineId } = req.body;
      
      console.log(`Machine reset requested via ${source} at ${timestamp} by user ${req.user?.id}`);
      
      // Create a maintenance action for machine reset
      const maintenanceAction = await storage.createMaintenanceAction({
        requestId: 1, // Default request ID for gesture-based resets
        actionType: 'reset',
        description: `Machine reset initiated via ${source}`,
        performedBy: req.user?.id?.toString() || 'unknown',
        status: 'completed',
        completedAt: new Date()
      });
      
      res.json({ 
        success: true, 
        message: 'Machine reset initiated',
        actionId: maintenanceAction.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resetting machine:', error);
      res.status(500).json({ error: 'Failed to reset machine' });
    }
  });

  // Get active job orders for mobile
  app.get('/api/job-orders', requireAuth, async (req: Request, res: Response) => {
    try {
      const { status, limit } = req.query;
      let jobOrders = await storage.getJobOrders();
      
      if (status) {
        jobOrders = jobOrders.filter(job => job.status === status);
      }
      
      if (limit) {
        jobOrders = jobOrders.slice(0, parseInt(limit as string));
      }
      
      res.json(jobOrders);
    } catch (error) {
      console.error('Error fetching job orders:', error);
      res.status(500).json({ error: 'Failed to fetch job orders' });
    }
  });

  // Get quality checks for mobile
  app.get('/api/quality-checks', requireAuth, async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      let qualityChecks = await storage.getQualityChecks();
      
      // Sort by most recent first
      qualityChecks.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      if (limit) {
        qualityChecks = qualityChecks.slice(0, parseInt(limit as string));
      }
      
      res.json(qualityChecks);
    } catch (error) {
      console.error('Error fetching quality checks:', error);
      res.status(500).json({ error: 'Failed to fetch quality checks' });
    }
  });
}