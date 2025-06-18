import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Award, Download, Eye, MoreHorizontal, Trash2, Calendar, User, Building, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import CertificateGenerator from "./certificate-generator";

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

interface CertificateListProps {
  trainingId?: number;
}

export default function CertificateList({ trainingId }: CertificateListProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<TrainingCertificate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: certificates = [], isLoading } = useQuery<TrainingCertificate[]>({
    queryKey: trainingId ? [`/api/trainings/${trainingId}/certificates`] : ["/api/training-certificates"]
  });

  const { data: trainings } = useQuery<Training[]>({
    queryKey: ["/api/trainings"]
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/training-certificates/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to delete certificate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Certificate deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/training-certificates"] });
      if (trainingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/trainings/${trainingId}/certificates`] });
      }
    },
    onError: () => {
      toast({ title: "Failed to delete certificate", variant: "destructive" });
    }
  });

  const revokeCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/training-certificates/${id}/revoke`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to revoke certificate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Certificate revoked successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/training-certificates"] });
      if (trainingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/trainings/${trainingId}/certificates`] });
      }
    },
    onError: () => {
      toast({ title: "Failed to revoke certificate", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "revoked":
        return <Badge className="bg-red-100 text-red-800">Revoked</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrainingInfo = (trainingId: number) => {
    const training = trainings?.find((t: any) => t.id === trainingId);
    return training ? `Training #${training.id} - ${training.trainingSection || ""}` : `Training #${trainingId}`;
  };

  const downloadCertificate = (certificate: TrainingCertificate) => {
    // This would trigger a download of the certificate PDF
    // For now, we'll show a placeholder action
    toast({ title: `Downloading certificate ${certificate.certificateNumber}` });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading certificates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Training Certificates</h3>
        </div>
        <Button onClick={() => setShowGenerator(true)} className="bg-blue-600 hover:bg-blue-700">
          <Award className="h-4 w-4 mr-2" />
          Generate Certificate
        </Button>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Certificates Found</h3>
            <p className="text-gray-500 mb-4">
              {trainingId 
                ? "No certificates have been generated for this training session." 
                : "No training certificates have been created yet."
              }
            </p>
            <Button onClick={() => setShowGenerator(true)} variant="outline">
              <Award className="h-4 w-4 mr-2" />
              Create First Certificate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Certificate Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate Number</TableHead>
                  {!trainingId && <TableHead>Training</TableHead>}
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate: TrainingCertificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        {certificate.certificateNumber}
                      </div>
                    </TableCell>
                    {!trainingId && (
                      <TableCell>{getTrainingInfo(certificate.trainingId)}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {format(new Date(certificate.issuedDate), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {certificate.validUntil ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {format(new Date(certificate.validUntil), "MMM dd, yyyy")}
                        </div>
                      ) : (
                        <span className="text-gray-400">No expiration</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">{certificate.issuerName}</div>
                          <div className="text-xs text-gray-500">{certificate.issuerTitle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(certificate.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedCertificate(certificate)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Certificate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadCertificate(certificate)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          {certificate.status === "active" && (
                            <DropdownMenuItem 
                              onClick={() => revokeCertificateMutation.mutate(certificate.id)}
                              className="text-orange-600"
                            >
                              <Award className="h-4 w-4 mr-2" />
                              Revoke Certificate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteCertificateMutation.mutate(certificate.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Certificate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Certificate Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Training Certificate</DialogTitle>
            <DialogDescription>
              Create and customize a training certificate for this course
            </DialogDescription>
          </DialogHeader>
          <CertificateGenerator
            trainingId={trainingId}
            onClose={() => setShowGenerator(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Certificate Viewer Dialog */}
      <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificate Details
            </DialogTitle>
            <DialogDescription>
              View and manage this training certificate
            </DialogDescription>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Certificate Number</label>
                  <p className="text-lg font-semibold">{selectedCertificate.certificateNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedCertificate.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Issued Date</label>
                  <p>{format(new Date(selectedCertificate.issuedDate), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Valid Until</label>
                  <p>{selectedCertificate.validUntil ? format(new Date(selectedCertificate.validUntil), "MMM dd, yyyy") : "No expiration"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Issuer</label>
                  <p>{selectedCertificate.issuerName}</p>
                  <p className="text-sm text-gray-500">{selectedCertificate.issuerTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Company</label>
                  <p>{selectedCertificate.companyName}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={() => downloadCertificate(selectedCertificate)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => setSelectedCertificate(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}