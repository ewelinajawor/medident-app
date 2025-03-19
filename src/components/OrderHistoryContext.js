import React, { createContext, useState } from "react";

export const OrderHistoryContext = createContext();

export const OrderHistoryProvider = ({ children }) => {
  const [orderHistory, setOrderHistory] = useState(
    JSON.parse(localStorage.getItem("orderHistory")) || []
  );

  const updateOrderHistory = (newOrder) => {
    const updatedHistory = [...orderHistory, newOrder];
    setOrderHistory(updatedHistory);
    localStorage.setItem("orderHistory", JSON.stringify(updatedHistory));
  };

  return (
    <OrderHistoryContext.Provider value={{ orderHistory, updateOrderHistory }}>
      {children}
    </OrderHistoryContext.Provider>
  );
};