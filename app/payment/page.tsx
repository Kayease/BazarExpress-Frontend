"use client";
import { useState } from "react";

const dummyCart = [
  { id: 1, name: "Burning Desire Pink Cone Rolling Paper", pack: "1 pack (6 pieces)", price: 100, qty: 1 },
  { id: 2, name: "Rolled Cones by SLIMJIM", pack: "1 pack (6 pieces)", price: 90, qty: 1 },
];
const dummyAddress = "Home: 2nd floor, 113, Kalyanpura, Sanganer, Jaipur";

export default function PaymentPage() {
  const [selectedUPI, setSelectedUPI] = useState("9058442532@ptyes");
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="flex-1 max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Select Payment Method</h1>
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="mb-4 font-semibold">Wallets</div>
          <div className="mb-4 font-semibold">Add credit or debit cards</div>
          <div className="mb-4 font-semibold">Netbanking</div>
          <div className="mb-4 font-semibold">Add new UPI ID</div>
          <div className="border rounded-lg p-4 flex items-center gap-3 mb-2 border-green-600 bg-green-50">
            <span className="bg-white border border-green-600 rounded-full px-2 py-1 text-green-700 font-bold">UPI</span>
            <span className="font-semibold text-lg">{selectedUPI}</span>
            <span className="ml-auto text-green-700 font-semibold">✔</span>
          </div>
          <div className="text-gray-500 text-sm mb-4">Please press continue to complete the purchase.</div>
          <div className="flex gap-3 mb-2">
            <span className="bg-gray-100 rounded px-2 py-1">GPay</span>
            <span className="bg-gray-100 rounded px-2 py-1">PhonePe</span>
            <span className="bg-gray-100 rounded px-2 py-1">BHIM</span>
            <span className="bg-gray-100 rounded px-2 py-1">Paytm</span>
          </div>
        </div>
        <button className="w-full bg-green-700 text-white font-semibold text-lg py-3 rounded-xl hover:bg-green-800 transition">Pay Now</button>
      </div>
      <div className="w-full max-w-md bg-[#f7f9fc] p-8 rounded-2xl shadow mt-8 md:mt-0 md:ml-8">
        <div className="mb-4 font-semibold text-gray-900">Delivery Address</div>
        <div className="mb-4 text-gray-700">{dummyAddress}</div>
        <div className="mb-4 font-semibold text-gray-900">My Cart</div>
        <div className="mb-4">
          {dummyCart.map((item) => (
            <div key={item.id} className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium text-gray-900 truncate w-40">{item.name}</div>
                <div className="text-gray-500 text-sm">{item.pack}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">₹{item.price}</div>
                <div className="text-gray-500 text-sm">Qty: {item.qty}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full bg-green-700 text-white font-semibold text-lg py-3 rounded-xl hover:bg-green-800 transition">Pay Now</button>
      </div>
    </div>
  );
} 