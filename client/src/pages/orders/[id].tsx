import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { OrderDetails } from "@/components/orders/order-details";
import { OrderForm } from "@/components/orders/order-form";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id;

  // Check if this is the new order page
  if (orderId === "new") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">New Order</h1>
        </div>
        <OrderForm />
      </div>
    );
  }

  // For existing orders
  const orderIdNumber = parseInt(orderId);

  if (isNaN(orderIdNumber)) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <h3 className="text-xl font-medium text-secondary-800 mb-2">Invalid Order ID</h3>
          <p className="text-secondary-600">
            The order ID provided is not valid.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Order Details</h1>
      </div>
      <OrderDetails orderId={orderIdNumber} />
    </div>
  );
}
