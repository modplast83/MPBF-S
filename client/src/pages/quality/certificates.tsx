import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Search, Filter, Download, Eye, Plus, Calendar, Building, User } from "lucide-react";
import { format } from "date-fns";
// Components will be moved to quality-specific components
// import CertificateGenerator from "@/components/hr/certificate-generator";
// import CertificateList from "@/components/hr/certificate-list";

interface CertificateStats {
  total: number;
  active: number;
  revoked: number;
  thisMonth: number;
}

interface TrainingCertificate {
  id: number;
  trainingId: number;
  certificateNumber: string;
  templateId: string;
  issuedDate: string;
  validUntil?: string;
  issuerName: string;
  issuerTitle: string;
  companyName: string;
  status: string;
  customDesign?: any;
}

interface Training {
  id: number;
  trainingId: string;
  date: string;
  traineeId: string;
  trainingSection: string;
  numberOfDays: number;
  supervisorId: string;
  supervisorSignature?: string;
  report?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showGenerator, setShowGenerator] = useState(false);

  const { data: certificates = [] } = useQuery<TrainingCertificate[]>({
    queryKey: ["/api/training-certificates"]
  });

  const { data: trainings = [] } = useQuery<Training[]>({
    queryKey: ["/api/trainings"]
  });

  // Calculate statistics
  const stats: CertificateStats = {
    total: certificates.length,
    active: certificates.filter((c: any) => c.status === "active").length,
    revoked: certificates.filter((c: any) => c.status === "revoked").length,
    thisMonth: certificates.filter((c: any) => {
      const issueDate = new Date(c.issuedDate);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
    }).length
  };

  // Filter certificates based on search and status
  const filteredCertificates = certificates.filter((certificate: any) => {
    const matchesSearch = certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.issuerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || certificate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getTrainingInfo = (trainingId: number) => {
    const training = trainings.find((t: any) => t.id === trainingId);
    return training ? {
      id: training.id,
      sections: training.trainingSection || "",
      trainee: training.traineeId,
      date: training.date
    } : null;
  };

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quality Training Certificates</h1>
          <p className="text-gray-600">Manage and track all quality training completion certificates</p>
        </div>
        <Button onClick={() => setShowGenerator(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Generate Certificate
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Training Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certificate List */}
          <div className="space-y-4">
            {filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                <p className="text-gray-500 mb-4">Generate your first training certificate to get started.</p>
                <Button onClick={() => setShowGenerator(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Certificate
                </Button>
              </div>
            ) : (
              filteredCertificates.map((certificate: any) => (
                <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Certificate #{certificate.certificateNumber}
                          </h3>
                          <Badge className={
                            certificate.status === "active" ? "bg-green-100 text-green-800" :
                            certificate.status === "revoked" ? "bg-red-100 text-red-800" :
                            certificate.status === "expired" ? "bg-gray-100 text-gray-800" :
                            "bg-blue-100 text-blue-800"
                          }>
                            {certificate.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Company: {certificate.companyName}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Issuer: {certificate.issuerName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Issued: {format(new Date(certificate.issuedDate), "MMM dd, yyyy")}
                          </div>
                        </div>
                        {certificate.validUntil && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Valid Until:</strong> {format(new Date(certificate.validUntil), "MMM dd, yyyy")}
                          </div>
                        )}
                        {getTrainingInfo(certificate.trainingId) && (
                          <div className="mt-2 text-sm text-gray-700">
                            <strong>Training:</strong> {getTrainingInfo(certificate.trainingId)?.sections} - {getTrainingInfo(certificate.trainingId)?.trainee}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certificate Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Training Certificate</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            Certificate generator component will be implemented for quality-specific training certificates.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}