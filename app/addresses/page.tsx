"use client"

import { useState } from "react"
import { Home, Building2, Pencil, ArrowLeft } from "lucide-react"
import Link from "next/link"

const dummyAddresses = [
  {
    id: 1,
    label: "Home",
    address: "2nd floor, 113, Kalyanpura, Sanganer, Jaipur",
    icon: <Home className="text-yellow-600 w-6 h-6" />,
  },
  {
    id: 2,
    label: "Home",
    address: "368A, Floor 3rd Chirag Delhi, Chirag Dilli, New Delhi",
    icon: <Home className="text-yellow-600 w-6 h-6" />,
  },
  {
    id: 3,
    label: "Work",
    address:
      "Rustam, Atlanta tower, 902 Floor, Atlanta tower, Gulbai tekra Atlanta Tower, Gulbai Tekra Road,Vasundhra Colony,Gulbai Tekra,Ahmedabad",
    icon: <Building2 className="text-yellow-600 w-6 h-6" />,
  },
]

export default function AddressPage() {
  const [selected, setSelected] = useState<number | null>(1)
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="max-w-lg mx-auto py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Select delivery address</h1>
        </div>
        <button className="w-full flex items-center gap-3 bg-white rounded-2xl shadow p-4 mb-6 text-green-700 font-semibold text-lg">
          <span className="text-2xl">+</span> Add a new address
        </button>
        <div className="text-gray-500 font-medium mb-2">Your saved address</div>
        <div className="flex flex-col gap-4">
          {dummyAddresses.map((addr) => (
            <div
              key={addr.id}
              className={`flex items-start gap-4 bg-white rounded-2xl shadow p-4 cursor-pointer border-2 ${selected === addr.id ? "border-green-600" : "border-transparent"}`}
              onClick={() => setSelected(addr.id)}
            >
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mt-1">{addr.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-900 mb-1">{addr.label}</div>
                <div className="text-gray-600 text-sm mb-2">{addr.address}</div>
                <button className="flex items-center gap-1 text-green-700 text-sm font-medium"><Pencil className="w-4 h-4" /> Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
