import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Package,
  Factory,
  Users,
  Layers
} from "lucide-react";
import type { JobOrder, Order, Customer, CustomerProduct, Item, MasterBatch } from "shared/schema";

type SortField = "orderId" | "id" | "customerName" | "productName" | "quantity";
type SortDirection = "asc" | "desc";

interface JobOrderWithDetails extends JobOrder {
  order?: Order;
  customer?: Customer;
  customerProduct?: CustomerProduct;
  item?: Item;
  masterBatch?: MasterBatch;
}

export default function JobOrdersPage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [masterbatchFilter, setMasterbatchFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("orderId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedJobOrders, setSelectedJobOrders] = useState<Set<number>>(new Set());

  // Fetch required data
  const { data: jobOrders = [], isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: ["/api/job-orders"]
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"]
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"]
  });

  const { data: customerProducts = [] } = useQuery<CustomerProduct[]>({
    queryKey: ["/api/customer-products"]
  });

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"]
  });

  const { data: masterBatches = [] } = useQuery<MasterBatch[]>({
    queryKey: ["/api/master-batches"]
  });

  // Filter job orders for "For Production" status orders only
  const productionJobOrders = useMemo(() => {
    return jobOrders
      .map((jo): JobOrderWithDetails => {
        const order = orders.find(o => o.id === jo.orderId);
        const customerProduct = customerProducts.find(cp => cp.id === jo.customerProductId);
        const customer = customers.find(c => c.id === (jo.customerId || customerProduct?.customerId));
        const item = items.find(i => i.id === customerProduct?.itemId);
        const masterBatch = masterBatches.find(mb => mb.id === customerProduct?.masterBatchId);

        return {
          ...jo,
          order,
          customer,
          customerProduct, 
          item,
          masterBatch
        };
      })
      .filter(jo => jo.order?.status === "processing");
  }, [jobOrders, orders, customers, customerProducts, items, masterBatches]);

  // Apply filters and sorting
  const filteredAndSortedJobOrders = useMemo(() => {
    let filtered = productionJobOrders;

    // Apply search filter (Order No)
    if (searchTerm) {
      filtered = filtered.filter(jo => 
        jo.orderId.toString().includes(searchTerm.toLowerCase()) ||
        jo.id.toString().includes(searchTerm.toLowerCase())
      );
    }

    // Apply customer filter
    if (customerFilter && customerFilter !== "all") {
      filtered = filtered.filter(jo => 
        jo.customer?.name.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }

    // Apply material filter
    if (materialFilter && materialFilter !== "all") {
      filtered = filtered.filter(jo => 
        jo.customerProduct?.rawMaterial?.toLowerCase().includes(materialFilter.toLowerCase())
      );
    }

    // Apply masterbatch filter
    if (masterbatchFilter && masterbatchFilter !== "all") {
      filtered = filtered.filter(jo => 
        jo.masterBatch?.name.toLowerCase().includes(masterbatchFilter.toLowerCase())
      );
    }

    // Apply product filter
    if (productFilter && productFilter !== "all") {
      filtered = filtered.filter(jo => 
        jo.item?.name.toLowerCase().includes(productFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "orderId":
          aValue = a.orderId;
          bValue = b.orderId;
          break;
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "customerName":
          aValue = a.customer?.name || "";
          bValue = b.customer?.name || "";
          break;
        case "productName":
          aValue = a.item?.name || "";
          bValue = b.item?.name || "";
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          aValue = a.orderId;
          bValue = b.orderId;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [productionJobOrders, searchTerm, customerFilter, masterbatchFilter, productFilter, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle selection
  const handleSelectAll = () => {
    if (selectedJobOrders.size === filteredAndSortedJobOrders.length) {
      setSelectedJobOrders(new Set());
    } else {
      setSelectedJobOrders(new Set(filteredAndSortedJobOrders.map(jo => jo.id)));
    }
  };

  const handleSelectJobOrder = (jobOrderId: number) => {
    const newSelected = new Set(selectedJobOrders);
    if (newSelected.has(jobOrderId)) {
      newSelected.delete(jobOrderId);
    } else {
      newSelected.add(jobOrderId);
    }
    setSelectedJobOrders(newSelected);
  };

  // Get unique values for filters
  const uniqueCustomers = useMemo(() => {
    const customerNames = productionJobOrders
      .map(jo => jo.customer?.name)
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    return customerNames.sort();
  }, [productionJobOrders]);

  const uniqueMaterials = useMemo(() => {
    const materialNames = productionJobOrders
      .map(jo => jo.customerProduct?.rawMaterial)
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    return materialNames.sort();
  }, [productionJobOrders]);

  const uniqueMasterBatches = useMemo(() => {
    const mbNames = productionJobOrders
      .map(jo => jo.masterBatch?.name)
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    return mbNames.sort();
  }, [productionJobOrders]);

  const uniqueProducts = useMemo(() => {
    const productNames = productionJobOrders
      .map(jo => jo.item?.name)
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    return productNames.sort();
  }, [productionJobOrders]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 data-[state=open]:bg-accent pl-[0px] pr-[0px]"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (jobOrdersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("job_orders.title")}</h1>
          <p className="text-muted-foreground">
            {t("job_orders.description", "Manage job orders for production scheduling and tracking")}
          </p>
        </div>
        
        {selectedJobOrders.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10">
              {selectedJobOrders.size} {t("common.selected")}
            </Badge>
            <Button variant="outline" size="sm">
              {t("common.actions")}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("common.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Order No Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("orders.order_no")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Customer Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("setup.customers.name")}</label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {uniqueCustomers.map((customer) => (
                    <SelectItem key={customer} value={customer || "unknown"}>
                      {customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Materials Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("orders.material")}</label>
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {uniqueMaterials.map((material) => (
                    <SelectItem key={material} value={material || "unknown"}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Master Batch Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("common.batch")}</label>
              <Select value={masterbatchFilter} onValueChange={setMasterbatchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {uniqueMasterBatches.map((mb) => (
                    <SelectItem key={mb} value={mb || "unknown"}>
                      {mb}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("orders.product")}</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {uniqueProducts.map((product) => (
                    <SelectItem key={product} value={product || "unknown"}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || customerFilter !== "all" || materialFilter !== "all" || masterbatchFilter !== "all" || productFilter !== "all") && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCustomerFilter("all");
                  setMaterialFilter("all");
                  setMasterbatchFilter("all");
                  setProductFilter("all");
                }}
              >
                {t("common.clear_filters")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Orders Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("job_orders.for_production")}
              </CardTitle>
              <CardDescription>
                {filteredAndSortedJobOrders.length} {t("common.total_records")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedJobOrders.size === filteredAndSortedJobOrders.length && filteredAndSortedJobOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="pl-[0px] pr-[0px]">
                    <SortButton field="orderId">{t("orders.order_id")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="id">{t("job_orders.jo_id")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="customerName">{t("setup.customers.name")}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="productName">{t("orders.product")}</SortButton>
                  </TableHead>
                  <TableHead>{t("orders.size")}</TableHead>
                  <TableHead>{t("orders.material")}</TableHead>
                  <TableHead>{t("common.batch")}</TableHead>
                  <TableHead>
                    <SortButton field="quantity">{t("job_orders.jo_qty")}</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedJobOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-8 w-8" />
                        <p>{t("job_orders.no_production_orders")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedJobOrders.map((jobOrder) => (
                    <TableRow key={jobOrder.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedJobOrders.has(jobOrder.id)}
                          onCheckedChange={() => handleSelectJobOrder(jobOrder.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        #{jobOrder.orderId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">JO-{jobOrder.id}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {jobOrder.customer?.name || t("common.unknown")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          {jobOrder.item?.name || t("common.unknown")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {jobOrder.customerProduct?.sizeCaption || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          {jobOrder.customerProduct?.rawMaterial || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {jobOrder.masterBatch?.name || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {jobOrder.quantity.toLocaleString()} kg
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}