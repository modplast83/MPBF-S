import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { calculateProgress } from "@/lib/utils";
import { Order, Customer, JobOrder, CustomerProduct } from "@shared/schema";

export function ActiveOrdersTable() {
  // Fetch all required data
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });
  
  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });
  
  const { data: customerProducts } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });
  
  // Get processing and pending orders
  const activeOrders = orders?.filter(
    order => order.status === "processing" || order.status === "pending"
  );
  
  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };
  
  const getOrderProducts = (orderId: number) => {
    const orderJobOrders = jobOrders?.filter(jo => jo.orderId === orderId) || [];
    
    return orderJobOrders.map(jo => {
      const product = customerProducts?.find(cp => cp.id === jo.customerProductId);
      return {
        productId: product?.itemId || "Unknown",
        size: product?.sizeCaption || "Unknown",
        quantity: jo.quantity,
        stage: "Extrusion", // Default to first stage
        progress: 35, // Sample value
      };
    });
  };
  
  const columns = [
    {
      header: "Order ID",
      accessorKey: "id",
    },
    {
      header: "Customer",
      accessorKey: (row: any) => getCustomerName(row.customerId),
    },
    {
      header: "Product",
      accessorKey: (row: any) => {
        const products = getOrderProducts(row.id);
        return products.length > 0 ? products[0].productId : "N/A";
      },
    },
    {
      header: "Size",
      accessorKey: (row: any) => {
        const products = getOrderProducts(row.id);
        return products.length > 0 ? products[0].size : "N/A";
      },
    },
    {
      header: "Quantity",
      accessorKey: (row: any) => {
        const products = getOrderProducts(row.id);
        return products.length > 0 ? `${products[0].quantity} Kg` : "N/A";
      },
    },
    {
      header: "Stage",
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        const stage = products.length > 0 ? products[0].stage : "N/A";
        const progress = products.length > 0 ? products[0].progress : 0;
        
        return (
          <div className="flex items-center">
            <div className="w-32 bg-secondary-200 rounded-full h-2.5">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="ml-2 text-xs">{stage}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Link href={`/orders/${row.id}`}>
            <Button variant="ghost" size="icon" className="text-primary-500 hover:text-primary-700">
              <span className="material-icons text-sm">visibility</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-warning-500 hover:text-warning-700">
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-error-500 hover:text-error-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];
  
  const actions = (
    <Link href="/orders/new">
      <Button className="bg-primary-500 text-white hover:bg-primary-600">
        <span className="material-icons text-sm mr-1">add</span>
        New Order
      </Button>
    </Link>
  );
  
  if (ordersLoading) {
    return (
      <div className="bg-white rounded-lg shadow animate-pulse">
        <div className="p-6 h-12 bg-secondary-50"></div>
        <div className="p-6 space-y-4">
          <div className="h-64 bg-secondary-50 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-secondary-100 flex justify-between items-center">
        <h3 className="font-semibold text-lg">Active Production Orders</h3>
        {actions}
      </div>
      <div className="p-6">
        <DataTable 
          data={activeOrders || []}
          columns={columns}
          actions={actions}
          onRowClick={(row) => window.location.href = `/orders/${row.id}`}
        />
      </div>
    </div>
  );
}
