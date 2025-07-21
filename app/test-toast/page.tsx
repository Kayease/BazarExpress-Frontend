"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export default function TestToastPage() {
  const [isLoading, setIsLoading] = useState(false)

  const testSuccessToast = () => {
    toast.success("This is a success toast!")
  }

  const testErrorToast = () => {
    toast.error("This is an error toast!")
  }

  const testLoadingToast = () => {
    setIsLoading(true)
    toast.loading("Loading...", { duration: 2000 })
    setTimeout(() => {
      toast.success("Loading completed!")
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Toast Test Page
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={testSuccessToast}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Success Toast
          </button>
          
          <button
            onClick={testErrorToast}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Test Error Toast
          </button>
          
          <button
            onClick={testLoadingToast}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Loading Toast
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Check the top-right corner for toast notifications</p>
        </div>
      </div>
    </div>
  )
} 