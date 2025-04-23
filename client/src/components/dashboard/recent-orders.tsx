import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { API_ENDPOINTS } from "@/lib/constants";
import { Order, Customer } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

export function RecentOrders() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Get most recent 4 orders (3 on mobile to save space)
  const recentOrders = orders
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, isMobile ? 3 : 4);

  const getCustomerName = (customerId: string) => {
    const fullName = customers?.find(c => c.id === customerId)?.name || t("common.unknown_customer");
    // Truncate long customer names on mobile
    if (isMobile && fullName.length > 20) {
      return fullName.substring(0, 18) + '...';
    }
    return fullName;
  };

  if (isLoading) {
    return (
      <Card className={`${isRTL ? "rtl text-right" : ""} rounded-xl overflow-hidden border border-gray-100`}>
        <CardHeader className="bg-gradient-to-r from-primary-50/40 to-white/40 pb-3 sm:pb-4 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-600 animate-pulse">
            <div className="h-6 w-6 bg-primary-100 rounded-full"></div>
            <div className="h-5 bg-gray-200 rounded w-40"></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {[...Array(isMobile ? 3 : 4)].map((_, i) => (
              <div key={i} className={`p-3 sm:p-4 animate-pulse flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-2/3">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-100 rounded mt-2 w-24"></div>
                  <div className="h-2 bg-gray-100 rounded mt-2 w-16"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50/50 border-t border-gray-100 py-2 sm:py-3">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={`${isRTL ? "rtl text-right" : ""} rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200`}>
      <CardHeader className="bg-gradient-to-r from-primary-50 to-white pb-3 sm:pb-4 border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <span className="material-icons text-primary-600">receipt_long</span>
          {t("dashboard.recent_orders")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-100">
          {recentOrders?.length ? (
            recentOrders.map((order) => (
              <li key={order.id} className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="min-w-0 flex-1 pr-2">
                  <Link href={`/orders/${order.id}`}>
                    <p className="font-medium text-primary-700 hover:text-primary-800 transition-colors truncate">
                      {t("orders.order_id")} #{order.id}
                    </p>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 flex items-center truncate">
                    <span className="material-icons text-gray-400 text-xs mr-1 flex-shrink-0">business</span>
                    <span className="truncate">{getCustomerName(order.customerId)}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </li>
            ))
          ) : (
            <li className="py-6 sm:py-8 text-center text-gray-500 bg-gray-50/50">{t("orders.no_recent_orders")}</li>
          )}
        </ul>
      </CardContent>
      <CardFooter className={`bg-gray-50/50 border-t border-gray-100 py-2 sm:py-3 ${isRTL ? "justify-end" : ""}`}>
        <Link href="/orders" className={`text-primary-600 text-sm font-medium flex items-center hover:text-primary-700 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
          {t("orders.see_all_orders")}
          <span className={`material-icons ${isRTL ? "ml-0 mr-1" : "ml-1"} bg-primary-100 rounded-full h-5 w-5 flex items-center justify-center text-xs`}>
            {isRTL ? "arrow_back" : "arrow_forward"}
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
