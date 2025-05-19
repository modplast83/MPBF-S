import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  CheckCircle2,
  FileWarning, 
  Search,
  ShieldAlert, 
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { QualityViolation } from "@shared/schema";

// Simplified version that displays the quality violations
export default function SimplifiedViolations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredViolations, setFilteredViolations] = useState<QualityViolation[]>([]);
  
  // Fetch violations
  const { data: violations, isLoading } = useQuery<QualityViolation[]>({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        console.error("Failed to fetch violations:", await response.text());
        return [];
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (violations) {
      const filtered = violations.filter((violation: QualityViolation) => 
        violation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredViolations(filtered);
    }
  }, [violations, searchTerm]);

  // Handle status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Open
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
            <Search className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {status}
          </Badge>
        );
    }
  };

  // Handle severity badge styling
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
            High
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            Critical
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
            {severity}
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Quality Violations" description="View reported violations in the production process" />
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6 mt-6">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search violations..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-orange-600" />
            Reported Quality Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-center">Loading violations...</div>
            </div>
          ) : filteredViolations?.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Reported On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViolations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-medium">{violation.id}</TableCell>
                      <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                      <TableCell className="max-w-md">{violation.description}</TableCell>
                      <TableCell>{getStatusBadge(violation.status)}</TableCell>
                      <TableCell>{violation.affectedArea}</TableCell>
                      <TableCell>
                        {violation.reportDate ? format(new Date(violation.reportDate), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center items-center p-8">
              <div className="text-center text-muted-foreground">
                No quality violations found. 
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}