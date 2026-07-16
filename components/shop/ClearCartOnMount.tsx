"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

// Clears the cart once when the order-success page mounts.
export default function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
