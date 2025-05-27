import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { calculateProgress } from "@/lib/utils";
import { Order, Customer, JobOrder, CustomerProduct } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export function ActiveOrdersTable() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  
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
    const name = customers?.find(c => c.id === customerId)?.name || t("common.unknown_customer");
    // Truncate long customer names on mobile
    if (isMobile && name.length > 15) {
      return name.substring(0, 13) + '...';
    }
    return name;
  };
  
  const getOrderProducts = (orderId: number) => {
    const orderJobOrders = jobOrders?.filter(jo => jo.orderId === orderId) || [];
    
    return orderJobOrders.map(jo => {
      const product = customerProducts?.find(cp => cp.id === jo.customerProductId);
      return {
        productId: product?.itemId || t("common.unknown"),
        size: product?.sizeCaption || t("common.unknown"),
        quantity: jo.quantity,
        stage: t("rolls.extrusion"), // Default to first stage
        progress: 35, // Sample value
      };
    });
  };
  
  // Define both mobile and desktop columns sets
  const desktopColumns = [
    {
      header: t("orders.order_id"),
      cell: (row: any) => <span>{row.id}</span>,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.customer"),
      cell: (row: any) => <span>{getCustomerName(row.customerId)}</span>,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("job_orders.customer_product"),
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        return <span>{products.length > 0 ? products[0].productId : t("common.not_available")}</span>;
      },
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.size"),
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        return <span>{products.length > 0 ? products[0].size : t("common.not_available")}</span>;
      },
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.quantity"),
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        return <span>{products.length > 0 ? `${products[0].quantity} Kg` : t("common.not_available")}</span>;
      },
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.stage"),
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        const stage = products.length > 0 ? products[0].stage : t("common.not_available");
        const progress = products.length > 0 ? products[0].progress : 0;
        
        return (
          <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-32 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary-500 h-2.5 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute inset-0 bg-white/30 h-full w-full bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]"></span>
              </div>
            </div>
            <span className={`${isRTL ? "mr-2" : "ml-2"} text-xs font-medium text-gray-600`}>{stage}</span>
          </div>
        );
      },
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.status"),
      cell: (row: any) => <StatusBadge status={row.status} />,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("common.actions"),
      cell: (row: any) => (
        <div className={`flex ${isRTL ? "space-x-reverse space-x-2 flex-row-reverse" : "space-x-2"}`}>
          <Link href={`/orders/${row.id}`}>
            <Button variant="outline" size="sm" className="text-primary-600 border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-full h-8 w-8 p-0">
              <span className="material-icons text-sm">visibility</span>
            </Button>
          </Link>
          <Link href={`/orders/edit/${row.id}`}>
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 rounded-full h-8 w-8 p-0">
              <span className="material-icons text-sm">edit</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-full h-8 w-8 p-0">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
  ];
  
  // Simpler mobile columns
  const mobileColumns = [
    {
      header: t("orders.order_id"),
      cell: (row: any) => <span className="font-medium">#{row.id}</span>,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.customer"),
      cell: (row: any) => <span className="text-sm truncate max-w-[100px]">{getCustomerName(row.customerId)}</span>,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.status"),
      cell: (row: any) => <StatusBadge status={row.status} />,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: "",
      cell: (row: any) => (
        <Link href={`/orders/${row.id}`}>
          <Button variant="outline" size="sm" className="text-primary-600 border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-full h-8 w-8 p-0">
            <span className="material-icons text-sm">visibility</span>
          </Button>
        </Link>
      ),
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
  ];
  
  const actions = (
    <Link href="/orders/new">
      <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-full shadow-sm text-sm sm:text-base text-[#000000]">
        <span className={`material-icons text-sm ${isRTL ? 'ml-1' : 'mr-1'}`}>add</span>
        {isMobile ? "" : t("orders.new_order")}
      </Button>
    </Link>
  );
  
  // Create responsive columns for our mobile view
  const responsiveColumns = [
    {
      header: t("orders.order_id"),
      cell: (row: any) => <span className="font-medium">#{row.id}</span>,
      meta: {
        isTitle: true,
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.customer"),
      cell: (row: any) => getCustomerName(row.customerId),
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("job_orders.customer_product"),
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        return products.length > 0 ? products[0].productId : t("common.not_available");
      },
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.quantity"),
      cell: (row: any) => {
        const products = getOrderProducts(row.id);
        return products.length > 0 ? `${products[0].quantity} Kg` : t("common.not_available");
      },
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("orders.status"),
      cell: (row: any) => <StatusBadge status={row.status} />,
      meta: {
        className: isRTL ? "text-right" : ""
      }
    },
    {
      header: t("common.actions"),
      cell: (row: any) => (
        <Link href={`/orders/${row.id}`}>
          <Button variant="outline" size="sm" className="text-primary-600 border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-full h-8 w-8 p-0 touch-manipulation">
            <span className="material-icons text-sm">visibility</span>
          </Button>
        </Link>
      ),
      meta: {
        isAction: true,
        className: isRTL ? "text-right" : ""
      }
    },
  ];
  
  if (ordersLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 animate-pulse ${isRTL ? 'rtl' : ''}`}>
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex justify-between items-center mb-1">
            <div className="h-7 bg-gray-200 rounded w-48"></div>
            <div className="h-9 bg-gray-200 rounded-full w-32"></div>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {isMobile ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="h-10 bg-gray-100 rounded-md"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-6 bg-gray-100 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-100 rounded w-1/5"></div>
                    <div className="h-6 bg-gray-100 rounded w-1/6"></div>
                    <div className="h-6 bg-gray-100 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 ${isRTL ? 'rtl' : ''}`}>
      <div className={`p-3 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="material-icons text-primary-600 text-sm sm:text-base">receipt_long</span>
          <h3 className={`font-semibold text-sm sm:text-lg text-gray-800 ${isRTL ? 'text-right' : ''}`}>
            Active Orders
          </h3>
        </div>
        {actions}
      </div>
      <div className="p-3 sm:p-6">
        {isMobile ? (
          <ResponsiveTable
            data={activeOrders || []}
            columns={responsiveColumns as any}
            actions={actions}
            dir={isRTL ? 'rtl' : 'ltr'}
            emptyMessage={t("orders.no_active_orders")}
            getRowUrl={(row) => `/orders/${row.id}`}
            pagination={false}
            searchable={false}
          />
        ) : (
          <DataTable 
            data={activeOrders || []}
            columns={desktopColumns as any}
            actions={actions}
            dir={isRTL ? 'rtl' : 'ltr'}
            onRowClick={(row) => window.location.href = `/orders/${row.id}`}
          />
        )}
      </div>
    </div>
  );
}
