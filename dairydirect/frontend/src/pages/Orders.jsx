// src/pages/Orders.jsx — Orders Page
import React, { useEffect, useState } from 'react';
import { orderAPI } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getAll();
        setOrders(response.data.orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>Order {order.id}</h3>
              <p>Status: {order.status}</p>
              <p>Total: ${order.total_price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
