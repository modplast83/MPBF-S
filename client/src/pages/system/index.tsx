import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface SettingCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
}

function SettingCard({ title, description, icon, path }: SettingCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center mb-2">
          <div className="rounded-full bg-primary-100 p-2 mr-3">
            <span className="material-icons text-primary-500">{icon}</span>
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mt-2 space-y-2">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-success mr-2"></div>
            <span className="text-sm text-secondary-600">Good configuration</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-warning-500 mr-2"></div>
            <span className="text-sm text-secondary-600">Pending setup tasks</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={path}>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-700">
            Manage Settings
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function SystemIndex() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">System Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <SettingCard
          title="Database Management"
          description="Backup, restore, and manage database operations"
          icon="storage"
          path="/system/database"
        />
        
        <SettingCard
          title="User Permissions"
          description="Configure user roles and access permissions"
          icon="admin_panel_settings"
          path="/system/permissions"
        />

        <SettingCard
          title="SMS Management"
          description="Send and manage SMS messages, track status"
          icon="message"
          path="/system/sms-management"
        />
        
        <SettingCard
          title="Import & Export"
          description="Import and export data for your factory system"
          icon="import_export"
          path="/system/import-export"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary-600">System Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary-600">Last Database Backup</span>
              <span className="font-medium">Never</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary-600">Environment</span>
              <span className="font-medium">Production</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary-600">Server Status</span>
              <span className="text-success font-medium flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-success mr-2"></span>
                Online
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Storage Usage</span>
              <span className="font-medium">45.3 MB</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Check for Updates</Button>
          <Button>System Diagnostics</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-primary-500">person</span>
                <div>
                  <p className="font-medium">User Login</p>
                  <p className="text-sm text-secondary-500">Admin user logged in</p>
                </div>
              </div>
              <p className="text-xs text-secondary-500">Today, 10:25 AM</p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-success">backup</span>
                <div>
                  <p className="font-medium">Automatic Backup</p>
                  <p className="text-sm text-secondary-500">System attempted backup but none was configured</p>
                </div>
              </div>
              <p className="text-xs text-secondary-500">Yesterday, 12:00 AM</p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-warning-500">update</span>
                <div>
                  <p className="font-medium">System Update</p>
                  <p className="text-sm text-secondary-500">System initialized to version 1.0.0</p>
                </div>
              </div>
              <p className="text-xs text-secondary-500">Apr 16, 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
