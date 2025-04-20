import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { API_ENDPOINTS } from "@/lib/constants";
import { Order, Customer } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";

export function RecentOrders() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  // Get most recent 4 orders
  const recentOrders = orders
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || t("common.unknown_customer");
  };

  if (isLoading) {
    return (
      <Card className={isRTL ? "rtl text-right" : ""}>
        <CardHeader>
          <CardTitle>{t("dashboard.recent_orders")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`animate-pulse flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-2/3">
                  <div className="h-4 bg-secondary-200 rounded"></div>
                  <div className="h-3 bg-secondary-100 rounded mt-2 w-1/2"></div>
                </div>
                <div className="h-6 w-20 bg-secondary-100 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isRTL ? "rtl text-right" : ""}>
      <CardHeader>
        <CardTitle>{t("dashboard.recent_orders")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-secondary-100">
          {recentOrders?.length ? (
            recentOrders.map((order) => (
              <li key={order.id} className={`py-3 flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                <div>
                  <p className="font-medium">{t("orders.order_id")} #{order.id}</p>
                  <p className="text-sm text-secondary-500">
                    {getCustomerName(order.customerId)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </li>
            ))
          ) : (
            <li className="py-4 text-center text-secondary-500">{t("orders.no_recent_orders")}</li>
          )}
        </ul>
      </CardContent>
      <CardFooter className={isRTL ? "justify-end" : ""}>
        <Link href="/orders" className={`text-primary-500 text-sm font-medium flex items-center hover:text-primary-600 ${isRTL ? "flex-row-reverse" : ""}`}>
          {t("orders.see_all_orders")}
          <span className={`material-icons text-sm ${isRTL ? "ml-0 mr-1" : "ml-1"}`}>
            {isRTL ? "arrow_back" : "arrow_forward"}
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
