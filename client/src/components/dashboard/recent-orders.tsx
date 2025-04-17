import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { API_ENDPOINTS } from "@/lib/constants";
import { Order, Customer } from "@shared/schema";

export function RecentOrders() {
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
    return customers?.find(c => c.id === customerId)?.name || "Unknown Customer";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between">
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-secondary-100">
          {recentOrders?.length ? (
            recentOrders.map((order) => (
              <li key={order.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">Order #{order.id}</p>
                  <p className="text-sm text-secondary-500">
                    {getCustomerName(order.customerId)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </li>
            ))
          ) : (
            <li className="py-4 text-center text-secondary-500">No recent orders found</li>
          )}
        </ul>
      </CardContent>
      <CardFooter>
        <Link href="/orders" className="text-primary-500 text-sm font-medium flex items-center hover:text-primary-600">
          See all orders
          <span className="material-icons text-sm ml-1">arrow_forward</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
