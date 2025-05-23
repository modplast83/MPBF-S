import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  BarChart2, 
  AlertTriangle,
  CheckCircle,
  FileWarning,
  ShieldAlert,
  ClipboardCheck,
  Layers,
  RefreshCw,
  Search,
  Filter,
  PieChart as PieChartIcon,
  Printer
} from "lucide-react";

// Professional Quality Dashboard component
export default function ProQualityDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams();
  const [_, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState(params.section || "overview");

  // Set the current section based on URL params
  useEffect(() => {
    if (params.section) {
      setActiveSection(params.section);
    }
  }, [params.section]);

  // Update URL when section changes
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setLocation(`/quality/${section}`);
  };

  // Fetch quality-related data
  const { data: qualityChecks, isLoading: checksLoading, refetch: refetchChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
    queryFn: async () => {
      const response = await fetch("/api/quality-checks");
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    }
  });

  const { data: violations, isLoading: violationsLoading, refetch: refetchViolations } = useQuery({
    queryKey: ["/api/quality-violations"],
    queryFn: async () => {
      const response = await fetch("/api/quality-violations");
      if (!response.ok) {
        throw new Error("Failed to fetch quality violations");
      }
      return response.json();
    }
  });

  const { data: penalties, isLoading: penaltiesLoading, refetch: refetchPenalties } = useQuery({
    queryKey: ["/api/quality-penalties"],
    queryFn: async () => {
      const response = await fetch("/api/quality-penalties");
      if (!response.ok) {
        throw new Error("Failed to fetch quality penalties");
      }
      return response.json();
    }
  });

  const { data: actions, isLoading: actionsLoading, refetch: refetchActions } = useQuery({
    queryKey: ["/api/corrective-actions"],
    queryFn: async () => {
      const response = await fetch("/api/corrective-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch corrective actions");
      }
      return response.json();
    }
  });

  const { data: checkTypes, isLoading: checkTypesLoading } = useQuery({
    queryKey: ["/api/quality-check-types"],
    queryFn: async () => {
      const response = await fetch("/api/quality-check-types");
      if (!response.ok) {
        throw new Error("Failed to fetch check types");
      }
      return response.json();
    }
  });

  // Calculate overall statistics
  const stats = {
    totalChecks: qualityChecks?.length || 0,
    passedChecks: qualityChecks?.filter(c => c.passed)?.length || 0,
    failedChecks: qualityChecks?.filter(c => !c.passed)?.length || 0,
    passRate: qualityChecks?.length 
      ? Math.round((qualityChecks.filter(c => c.passed).length / qualityChecks.length) * 100) 
      : 0,
    totalViolations: violations?.length || 0,
    openViolations: violations?.filter(v => v.status === "Open" || v.status === "In Progress")?.length || 0,
    totalPenalties: penalties?.length || 0,
    activePenalties: penalties?.filter(p => p.status === "Active" || p.status === "Pending")?.length || 0,
    totalActions: actions?.length || 0,
    pendingActions: actions?.filter(a => !a.verifiedDate)?.length || 0
  };

  // Determine loading state
  const isLoading = checksLoading || violationsLoading || penaltiesLoading || 
    actionsLoading || checkTypesLoading;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("quality.management")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {t("quality.comprehensive_control")}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Select value={activeSection} onValueChange={handleSectionChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("quality.select_section")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("quality.sections")}</SelectLabel>
                <SelectItem value="overview">{t("quality.overview")}</SelectItem>
                <SelectItem value="checks">{t("quality.checks")}</SelectItem>
                <SelectItem value="violations">{t("quality.violations")}</SelectItem>
                <SelectItem value="actions">{t("quality.corrective_actions")}</SelectItem>
                <SelectItem value="penalties">{t("quality.penalties")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              refetchChecks();
              refetchViolations();
              refetchPenalties();
              refetchActions();
              toast({
                title: t("common.refreshed"),
                description: t("quality.data_refreshed"),
              });
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      {activeSection === "overview" && (
        <QualityOverview stats={stats} isLoading={isLoading} />
      )}

      {activeSection === "checks" && (
        <ChecksSection 
          checks={qualityChecks || []} 
          checkTypes={checkTypes || []} 
          isLoading={isLoading} 
        />
      )}

      {activeSection === "violations" && (
        <ViolationsSection 
          violations={violations || []} 
          isLoading={isLoading} 
        />
      )}

      {activeSection === "actions" && (
        <ActionsSection 
          actions={actions || []} 
          isLoading={isLoading} 
        />
      )}

      {activeSection === "penalties" && (
        <PenaltiesSection 
          penalties={penalties || []} 
          isLoading={isLoading} 
        />
      )}
    </div>
  );
}

// Overview section
function QualityOverview({ stats, isLoading }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.quality_rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.passRate}%</div>
              <Badge variant={stats.passRate > 90 ? "outline" : stats.passRate > 75 ? "secondary" : "destructive"}>
                {stats.passRate > 90 ? t("quality.excellent") : stats.passRate > 75 ? t("quality.average") : t("quality.poor")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalChecks} {t("quality.total_checks")}, {stats.failedChecks} {t("quality.failed")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.violations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalViolations}</div>
              <Badge variant={stats.openViolations > 0 ? "destructive" : "outline"}>
                {stats.openViolations} {t("quality.open")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalViolations - stats.openViolations} {t("quality.resolved")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.actions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <Badge variant={stats.pendingActions > 0 ? "secondary" : "outline"}>
                {stats.pendingActions} {t("quality.pending")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalActions - stats.pendingActions} {t("quality.completed")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("quality.penalties")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalPenalties}</div>
              <Badge variant={stats.activePenalties > 0 ? "destructive" : "outline"}>
                {stats.activePenalties} {t("quality.active")}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalPenalties - stats.activePenalties} {t("quality.closed")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2 row-span-2">
          <CardHeader>
            <CardTitle>{t("quality.recent_quality_checks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-3 md:col-span-1 flex flex-col items-center justify-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <div className="text-2xl font-bold">{stats.passedChecks}</div>
                <div className="text-sm text-gray-500">{t("quality.passed_checks")}</div>
              </div>
              <div className="col-span-3 md:col-span-1 flex flex-col items-center justify-center p-4 border rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                <div className="text-2xl font-bold">{stats.failedChecks}</div>
                <div className="text-sm text-gray-500">{t("quality.failed_checks")}</div>
              </div>
              <div className="col-span-3 md:col-span-1 flex flex-col items-center justify-center p-4 border rounded-lg">
                <BarChart2 className="h-8 w-8 text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{stats.passRate}%</div>
                <div className="text-sm text-gray-500">{t("quality.success_rate")}</div>
              </div>
            </div>
            
            <div className="text-center py-4">
              <p className="text-gray-500">{t("quality.check_history")}</p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-center">
            <Button variant="outline">
              {t("quality.view_all_checks")}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quality.violation_summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <FileWarning className="h-12 w-12 text-amber-500 mb-4" />
              <div className="text-3xl font-bold">{stats.totalViolations}</div>
              <div className="text-sm text-gray-500 mt-2">{t("quality.total_violations")}</div>
              <div className="flex justify-between w-full mt-4">
                <div className="text-center">
                  <div className="text-xl font-semibold">{stats.openViolations}</div>
                  <div className="text-xs text-gray-500">{t("quality.open")}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold">{stats.totalViolations - stats.openViolations}</div>
                  <div className="text-xs text-gray-500">{t("quality.resolved")}</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-center">
            <Button variant="outline">
              {t("quality.manage_violations")}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quality.action_summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <ShieldAlert className="h-12 w-12 text-purple-500 mb-4" />
              <div className="text-3xl font-bold">{stats.totalActions}</div>
              <div className="text-sm text-gray-500 mt-2">{t("quality.corrective_actions")}</div>
              <div className="flex justify-between w-full mt-4">
                <div className="text-center">
                  <div className="text-xl font-semibold">{stats.pendingActions}</div>
                  <div className="text-xs text-gray-500">{t("quality.pending")}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold">{stats.totalActions - stats.pendingActions}</div>
                  <div className="text-xs text-gray-500">{t("quality.completed")}</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-center">
            <Button variant="outline">
              {t("quality.view_actions")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

// Quality Checks Section
function ChecksSection({ checks, checkTypes, isLoading }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);

  // Filter checks based on search term
  useEffect(() => {
    if (!checks) return;
    
    const results = checks.filter(check => {
      return (
        String(check.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (check.rollId && check.rollId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (check.performedBy && check.performedBy.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    
    setFiltered(results);
  }, [checks, searchTerm]);

  // View check details
  const viewCheckDetails = (check) => {
    setSelectedCheck(check);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <CardTitle>{t("quality.quality_checks")}</CardTitle>
            <Button 
              className="mt-2 sm:mt-0"
              size="sm"
            >
              {t("quality.new_check")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder={t("quality.search_checks")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">{t("quality.no_checks_found")}</h3>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? t("quality.try_different_search") : t("quality.no_checks_yet")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">{t("quality.id")}</TableHead>
                    <TableHead>{t("quality.type")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("quality.roll")}</TableHead>
                    <TableHead>{t("quality.result")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("quality.date")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(check => (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.id}</TableCell>
                      <TableCell>
                        {checkTypes.find(t => t.id === check.checkTypeId)?.name || check.checkTypeId}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {check.rollId || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={check.passed ? "outline" : "destructive"}>
                          {check.passed ? t("quality.passed") : t("quality.failed")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(check.checkDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewCheckDetails(check)}
                        >
                          {t("common.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedCheck && (
            <>
              <DialogHeader>
                <DialogTitle>{t("quality.check_details")}</DialogTitle>
                <DialogDescription>
                  {t("quality.check")} #{selectedCheck.id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.check_type")}</h4>
                    <p>{checkTypes.find(t => t.id === selectedCheck.checkTypeId)?.name || selectedCheck.checkTypeId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.result")}</h4>
                    <Badge variant={selectedCheck.passed ? "outline" : "destructive"}>
                      {selectedCheck.passed ? t("quality.passed") : t("quality.failed")}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.date")}</h4>
                    <p>{new Date(selectedCheck.checkDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{t("quality.performed_by")}</h4>
                    <p>{selectedCheck.performedBy}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t("quality.roll")}</h4>
                  <p>{selectedCheck.rollId || "-"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t("quality.job_order")}</h4>
                  <p>{selectedCheck.jobOrderId ? `JO #${selectedCheck.jobOrderId}` : "-"}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">{t("quality.notes")}</h4>
                  <p className="text-sm">{selectedCheck.notes || "-"}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  {t("common.close")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Violations Section
function ViolationsSection({ violations, isLoading }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState([]);

  // Filter violations based on search term
  useEffect(() => {
    if (!violations) return;
    
    const results = violations.filter(violation => {
      return (
        String(violation.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (violation.description && violation.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (violation.reportedBy && violation.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    
    setFiltered(results);
  }, [violations, searchTerm]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.violations")}</CardTitle>
          <Button 
            className="mt-2 sm:mt-0"
            size="sm"
          >
            {t("quality.report_violation")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("quality.search_violations")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <FileWarning className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_violations_found")}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? t("quality.try_different_search") : t("quality.no_violations_reported")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(violation => (
              <Card key={violation.id} className="overflow-hidden">
                <CardHeader className="pb-2 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        violation.severity === 'Critical' ? 'destructive' : 
                        violation.severity === 'Major' ? 'secondary' : 
                        'outline'
                      }>
                        {violation.severity}
                      </Badge>
                      <CardTitle className="text-base">
                        {t("quality.violation")} #{violation.id}
                      </CardTitle>
                    </div>
                    <Badge variant={
                      violation.status === 'Open' ? 'outline' : 
                      violation.status === 'In Progress' ? 'secondary' : 
                      'outline'
                    }>
                      {violation.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.reported_by")}: {violation.reportedBy} • {new Date(violation.reportDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm mb-2 line-clamp-2">{violation.description}</p>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    {t("common.details")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Corrective Actions Section
function ActionsSection({ actions, isLoading }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState([]);

  // Filter actions based on search term
  useEffect(() => {
    if (!actions) return;
    
    const results = actions.filter(action => {
      return (
        String(action.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (action.action && action.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (action.implementedBy && action.implementedBy.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    
    setFiltered(results);
  }, [actions, searchTerm]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.corrective_actions")}</CardTitle>
          <Button 
            className="mt-2 sm:mt-0"
            size="sm"
          >
            {t("quality.new_action")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("quality.search_actions")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_actions_found")}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? t("quality.try_different_search") : t("quality.no_actions_yet")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(action => (
              <Card key={action.id} className="overflow-hidden">
                <CardHeader className="pb-2 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      {t("quality.action")} #{action.id}
                    </CardTitle>
                    <Badge variant={action.verifiedDate ? 'outline' : 'secondary'}>
                      {action.verifiedDate ? t("quality.verified") : t("quality.pending")}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.related_check")}: #{action.qualityCheckId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm mb-2 line-clamp-2">{action.action}</p>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                    <span>{t("quality.implemented_by")}: {action.implementedBy || "-"}</span>
                    {action.implementationDate && (
                      <span>• {new Date(action.implementationDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    {t("common.details")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Penalties Section
function PenaltiesSection({ penalties, isLoading }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState([]);

  // Filter penalties based on search term
  useEffect(() => {
    if (!penalties) return;
    
    const results = penalties.filter(penalty => {
      return (
        String(penalty.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (penalty.description && penalty.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (penalty.assignedTo && penalty.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    
    setFiltered(results);
  }, [penalties, searchTerm]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>{t("quality.penalties")}</CardTitle>
          <Button 
            className="mt-2 sm:mt-0"
            size="sm"
          >
            {t("quality.assign_penalty")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("quality.search_penalties")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">{t("quality.no_penalties_found")}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? t("quality.try_different_search") : t("quality.no_penalties_assigned")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(penalty => (
              <Card key={penalty.id} className="overflow-hidden">
                <CardHeader className="pb-2 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        penalty.penaltyType === 'Financial' ? 'destructive' : 
                        penalty.penaltyType === 'Training' ? 'secondary' : 
                        'outline'
                      }>
                        {penalty.penaltyType}
                      </Badge>
                      <CardTitle className="text-base">
                        {t("quality.penalty")} #{penalty.id}
                      </CardTitle>
                    </div>
                    <Badge variant={
                      penalty.status === 'Active' ? 'destructive' : 
                      penalty.status === 'Pending' ? 'secondary' : 
                      'outline'
                    }>
                      {penalty.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("quality.assigned_to")}: {penalty.assignedTo} • {new Date(penalty.assignedDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm mb-2 line-clamp-2">{penalty.description}</p>
                  <div className="text-xs text-gray-500">
                    {t("quality.related_violation")}: #{penalty.violationId}
                    {penalty.penaltyAmount && (
                      <span> • {t("quality.amount")}: ${penalty.penaltyAmount}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    {t("quality.print")}
                  </Button>
                  <Button variant="outline" size="sm">
                    {t("common.details")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}