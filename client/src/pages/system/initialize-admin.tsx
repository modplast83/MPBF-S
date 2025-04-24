import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function InitializeAdmin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
  } | null>(null);

  const handleInitAdmin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin-permissions/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to initialize admin permissions: ${errorText}`);
      }

      const data = await response.json();
      setResult({
        created: data.created,
        updated: data.updated
      });

      toast({
        title: "Success",
        description: "Admin permissions initialized successfully",
      });
    } catch (error) {
      console.error("Error initializing admin permissions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize admin permissions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Initialize Admin Permissions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Permissions</CardTitle>
          <CardDescription>
            Initialize or reset permissions for administrator users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <span className="material-icons text-warning-500 mr-2">info</span>
              <div>
                <h3 className="font-medium text-secondary-900">Administrator Permissions</h3>
                <p className="text-sm text-secondary-600">
                  Clicking the button below will grant full permissions to admin users.
                  This will ensure administrators have access to all system modules.
                </p>
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <span className="material-icons text-green-500 mr-2">check_circle</span>
                <div>
                  <h3 className="font-medium text-secondary-900">Permissions Initialized</h3>
                  <p className="text-sm text-secondary-600">
                    Created {result.created} new permissions and updated {result.updated} existing permissions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleInitAdmin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize Admin Permissions'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}