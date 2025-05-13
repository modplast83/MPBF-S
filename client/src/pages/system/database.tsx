import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define backup file type
interface BackupFile {
  name: string;
  fileName: string;
  size: number;
  createdAt: string;
}

export default function Database() {
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [dbInfo, setDbInfo] = useState({
    type: "PostgreSQL",
    size: "0 KB",
    records: 0,
    lastBackup: "Never",
    status: "Healthy"
  });

  // Fetch available backups
  useEffect(() => {
    const fetchBackups = async () => {
      setIsLoadingBackups(true);
      try {
        const response = await fetch(API_ENDPOINTS.DATABASE_BACKUPS);
        if (!response.ok) {
          throw new Error(`Failed to fetch backups: ${response.statusText}`);
        }
        const data = await response.json();
        setBackupFiles(data || []);

        // Update last backup info if there's at least one backup
        if (data && data.length > 0) {
          const mostRecentBackup = new Date(data[0].createdAt);
          setDbInfo(prev => ({
            ...prev,
            lastBackup: formatDistanceToNow(mostRecentBackup, { addSuffix: true })
          }));
        }
      } catch (error) {
        console.error("Error fetching backups:", error);
        toast({
          title: "Error",
          description: "Failed to fetch database backups",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBackups(false);
      }
    };

    fetchBackups();
  }, [restoreDialogOpen]); // Refetch after restore dialog is closed

  const handleBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a backup name",
        variant: "destructive",
      });
      return;
    }

    setBackupInProgress(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.DATABASE_BACKUP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: backupName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create backup");
      }

      const result = await response.json();
      
      setBackupInProgress(false);
      setBackupDialogOpen(false);
      toast({
        title: "Backup Created",
        description: `Database backup "${backupName}" has been created successfully.`,
      });
      setBackupName("");
      
      // Refresh the backup list
      const backupsResponse = await fetch(API_ENDPOINTS.DATABASE_BACKUPS);
      if (backupsResponse.ok) {
        const backupsData = await backupsResponse.json();
        setBackupFiles(backupsData || []);
        
        // Update last backup info
        if (backupsData && backupsData.length > 0) {
          const mostRecentBackup = new Date(backupsData[0].createdAt);
          setDbInfo(prev => ({
            ...prev,
            lastBackup: formatDistanceToNow(mostRecentBackup, { addSuffix: true })
          }));
        }
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Error",
        description: `Failed to create backup: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) {
      toast({
        title: "Error",
        description: "Please select a backup file to restore",
        variant: "destructive",
      });
      return;
    }

    setRestoreInProgress(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.DATABASE_RESTORE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: selectedBackup }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to restore database");
      }

      const result = await response.json();
      
      setRestoreInProgress(false);
      setRestoreDialogOpen(false);
      toast({
        title: "Database Restored",
        description: "The database has been restored successfully.",
      });
      setSelectedBackup(null);
    } catch (error) {
      console.error("Error restoring database:", error);
      toast({
        title: "Error",
        description: `Failed to restore database: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setRestoreInProgress(false);
    }
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
                  disabled={backupFiles.length === 0}
                >
                  <span className="material-icons text-sm mr-1">restore</span>
                  Restore from Backup
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Backup List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Backup History</CardTitle>
              <CardDescription>
                List of available database backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBackups ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading backups...</span>
                </div>
              ) : backupFiles.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <span className="material-icons text-gray-300 text-3xl mb-2">storage</span>
                  <p className="text-gray-500">No backup files found. Create your first backup.</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backupFiles.map((backup) => (
                        <TableRow key={backup.fileName}>
                          <TableCell className="font-medium">{backup.name}</TableCell>
                          <TableCell>{backup.size} KB</TableCell>
                          <TableCell>
                            {new Date(backup.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Database Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Database Type</span>
                  <span className="font-medium">{dbInfo.type}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Size</span>
                  <span className="font-medium">{dbInfo.size}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-secondary-600">Last Backup</span>
                  <span className="font-medium">{dbInfo.lastBackup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Status</span>
                  <span className="text-success font-medium flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-success mr-2"></span>
                    {dbInfo.status}
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
              {backupInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Backing Up...
                </>
              ) : (
                "Create Backup"
              )}
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

            <div className="mt-4">
              {isLoadingBackups ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm">Loading backups...</span>
                </div>
              ) : backupFiles.length === 0 ? (
                <div className="bg-secondary-50 rounded-md p-3">
                  <p className="text-sm font-medium">Available Backups</p>
                  <p className="text-xs text-secondary-500 mt-1">No backups available</p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="backupSelect">Select a backup to restore</Label>
                  <ScrollArea className="h-[200px] border rounded-md mt-2 p-2">
                    <div className="space-y-2">
                      {backupFiles.map((backup) => (
                        <div 
                          key={backup.fileName}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedBackup === backup.fileName 
                              ? 'bg-primary-50 border-primary-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedBackup(backup.fileName)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{backup.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(backup.createdAt).toLocaleString()} • {backup.size} KB
                              </p>
                            </div>
                            {selectedBackup === backup.fileName && (
                              <span className="material-icons text-primary-500">check_circle</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setSelectedBackup(null);
              }}
              disabled={restoreInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={restoreInProgress || !selectedBackup}
              variant="destructive"
            >
              {restoreInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Restoring...
                </>
              ) : (
                "Restore Database"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}