import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Database() {
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  const handleBackup = () => {
    if (!backupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a backup name",
        variant: "destructive",
      });
      return;
    }

    setBackupInProgress(true);
    
    // Simulate backup process
    setTimeout(() => {
      setBackupInProgress(false);
      setBackupDialogOpen(false);
      toast({
        title: "Backup Created",
        description: `Database backup "${backupName}" has been created successfully.`,
      });
      setBackupName("");
    }, 1500);
  };

  const handleRestore = () => {
    setRestoreInProgress(true);
    
    // Simulate restore process
    setTimeout(() => {
      setRestoreInProgress(false);
      setRestoreDialogOpen(false);
      toast({
        title: "Database Restored",
        description: "The database has been restored successfully.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Database Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Backup Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-600">
                  Create a backup of your current database state. Backups can be used to restore
                  your data in case of emergencies or when migrating to a new server.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setBackupDialogOpen(true)}
                  className="w-full"
                >
                  <span className="material-icons text-sm mr-1">backup</span>
                  Create Backup
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Restore Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-600">
                  Restore your database from a previously created backup.
                  Warning: This will replace all current data with the backup data.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setRestoreDialogOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <span className="material-icons text-sm mr-1">restore</span>
                  Restore from Backup
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Database Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Database Type</span>
                  <span className="font-medium">In-Memory Storage</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Size</span>
                  <span className="font-medium">0.45 MB</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Records</span>
                  <span className="font-medium">137</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Last Backup</span>
                  <span className="font-medium">Never</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Status</span>
                  <span className="text-success font-medium flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-success mr-2"></span>
                    Healthy
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="backupName">Backup Name</Label>
            <Input
              id="backupName"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="e.g., Production_Backup_April_2025"
              className="mt-1"
            />
            <p className="text-sm text-secondary-500 mt-2">
              Give your backup a descriptive name to help identify it later.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBackupDialogOpen(false)}
              disabled={backupInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBackup}
              disabled={backupInProgress}
            >
              {backupInProgress ? "Backing Up..." : "Create Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-warning-500 font-medium flex items-center mb-4">
              <span className="material-icons text-sm mr-1">warning</span>
              Warning: This action will replace all current data
            </p>
            <p className="text-secondary-600">
              Restoring from a backup will replace all your current data with the data from the backup.
              This action cannot be undone. Make sure you have a backup of your current data if needed.
            </p>

            <div className="mt-4 bg-secondary-50 rounded-md p-3">
              <p className="text-sm font-medium">Available Backups</p>
              <p className="text-xs text-secondary-500 mt-1">No backups available</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              disabled={restoreInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={restoreInProgress}
              variant="destructive"
            >
              {restoreInProgress ? "Restoring..." : "Restore Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}