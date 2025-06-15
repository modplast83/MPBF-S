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
import CertificateGenerator from "@/components/hr/certificate-generator";
import CertificateList from "@/components/hr/certificate-list";

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Certificates</h1>
          <p className="text-gray-600">Manage and track all training completion certificates</p>
        </div>
        <Button onClick={() => setShowGenerator(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Generate Certificate
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revoked</p>
                <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Award className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search certificates by number, issuer, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || statusFilter !== "all" ? "No certificates match your search" : "No certificates found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search criteria or filters."
                : "Start by generating your first training certificate."
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate First Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate: any) => {
            const trainingInfo = getTrainingInfo(certificate.trainingId);
            return (
              <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{certificate.certificateNumber}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {format(new Date(certificate.issuedDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={certificate.status === "active" ? "default" : "secondary"}
                      className={
                        certificate.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : certificate.status === "revoked"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {certificate.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trainingInfo && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Training #{trainingInfo.id}</p>
                      <p className="text-sm text-blue-700">
                        {trainingInfo.sections || "General Training"}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        <strong>Issuer:</strong> {certificate.issuerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>
                        <strong>Company:</strong> {certificate.companyName}
                      </span>
                    </div>
                    {certificate.validUntil && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          <strong>Valid until:</strong> {format(new Date(certificate.validUntil), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Certificate Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Training Certificate</DialogTitle>
          </DialogHeader>
          <CertificateGenerator onClose={() => setShowGenerator(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}