"use client"

import React, { useEffect, useState } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import toast from "react-hot-toast"
import {
  Truck,
  MapPin,
  Settings,
  Save,
  RefreshCw,
  Info,
  Calculator,
  CreditCard,
  IndianRupee
} from "lucide-react"

// Types
interface DeliverySettings {
  _id?: string
  freeDeliveryMinAmount: number
  freeDeliveryRadius: number
  baseDeliveryCharge: number
  minimumDeliveryCharge: number
  maximumDeliveryCharge: number
  perKmCharge: number
  codExtraCharges: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    name: string
    email: string
  }
  updatedBy?: {
    name: string
    email: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL
const DELIVERY_API = `${API_URL}/delivery`

export default function DeliveryManagementPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [formData, setFormData] = useState<DeliverySettings>({
    freeDeliveryMinAmount: 500,
    freeDeliveryRadius: 3,
    baseDeliveryCharge: 20,
    minimumDeliveryCharge: 10,
    maximumDeliveryCharge: 100,
    perKmCharge: 5,
    codExtraCharges: false,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Calculate delivery charge based on distance and order amount
  const calculateDeliveryCharge = React.useCallback((distance: number, orderAmount: number) => {
    if (!distance || !orderAmount) {
      updateCalculatorUI(0, 0);
      return;
    }

    // Check for free delivery based on order amount
    if (orderAmount >= formData.freeDeliveryMinAmount && distance <= formData.freeDeliveryRadius) {
      updateCalculatorUI(0, 0, true);
      return;
    }

    // Calculate distance charge
    let distanceCharge = 0;
    if (distance > formData.freeDeliveryRadius) {
      // Only charge for distance beyond free delivery radius
      const chargableDistance = distance - formData.freeDeliveryRadius;
      distanceCharge = chargableDistance * formData.perKmCharge;
    }

    // Calculate base total charge
    let totalCharge = formData.baseDeliveryCharge + distanceCharge;

    // Apply min/max limits
    totalCharge = Math.max(formData.minimumDeliveryCharge, totalCharge);
    totalCharge = Math.min(formData.maximumDeliveryCharge, totalCharge);

    updateCalculatorUI(distanceCharge, totalCharge);
  }, [formData]); // Add formData as dependency

  // Update calculator UI elements
  const updateCalculatorUI = (distanceCharge: number, totalCharge: number, isFreeDelivery = false) => {
    const distanceChargeElement = document.getElementById('distanceCharge');
    const totalChargeElement = document.getElementById('totalCharge');
    const freeDeliveryMessage = document.getElementById('freeDeliveryMessage');
    
    // If not free delivery and COD extra charges are enabled, add to total
    if (!isFreeDelivery && formData.codExtraCharges) {
      totalCharge += 20; // Add COD extra charge to the total
    }

    if (distanceChargeElement) {
      distanceChargeElement.textContent = `₹${distanceCharge.toFixed(2)}`;
    }
    if (totalChargeElement) {
      totalChargeElement.textContent = `₹${totalCharge.toFixed(2)}`;
    }
    if (freeDeliveryMessage) {
      freeDeliveryMessage.classList.toggle('hidden', !isFreeDelivery);
    }
  }

  // Fetch delivery settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${DELIVERY_API}/settings`)
      const data = await response.json()

      if (data.success && data.settings) {
        setSettings(data.settings)
        setFormData(data.settings)
      } else {
        setSettings(null)
      }
    } catch (error) {
      console.error('Error fetching delivery settings:', error)
      toast.error('Failed to load delivery settings')
    } finally {
      setLoading(false)
    }
  }

  // Initialize default settings
  const initializeSettings = async () => {
    try {
      setInitializing(true)
      const response = await fetch(`${DELIVERY_API}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Default delivery settings initialized')
        await fetchSettings()
      } else {
        toast.error(data.error || 'Failed to initialize settings')
      }
    } catch (error) {
      console.error('Error initializing settings:', error)
      toast.error('Failed to initialize settings')
    } finally {
      setInitializing(false)
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (formData.freeDeliveryMinAmount < 0) {
      newErrors.freeDeliveryMinAmount = 'Free delivery minimum amount must be positive'
    }

    if (formData.freeDeliveryRadius <= 0) {
      newErrors.freeDeliveryRadius = 'Free delivery radius must be greater than 0'
    }

    if (formData.baseDeliveryCharge < 0) {
      newErrors.baseDeliveryCharge = 'Base delivery charge must be positive'
    }

    if (formData.minimumDeliveryCharge < 0) {
      newErrors.minimumDeliveryCharge = 'Minimum delivery charge must be positive'
    }

    if (formData.maximumDeliveryCharge <= formData.minimumDeliveryCharge) {
      newErrors.maximumDeliveryCharge = 'Maximum charge must be greater than minimum charge'
    }

    if (formData.perKmCharge < 0) {
      newErrors.perKmCharge = 'Per km charge must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Save settings
  const saveSettings = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${DELIVERY_API}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          _id: settings?._id
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Delivery settings updated successfully')
        setSettings(data.settings)
        setFormData(data.settings)
      } else {
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Handle input change
  const handleInputChange = (field: keyof DeliverySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Watch for changes in form data and calculator inputs
  useEffect(() => {
    const distance = Number((document.getElementById('distance') as HTMLInputElement)?.value);
    const orderAmount = Number((document.getElementById('orderAmount') as HTMLInputElement)?.value);
    if (distance && orderAmount) {
      calculateDeliveryCharge(distance, orderAmount);
    }
  }, [formData]); // Re-run when formData changes

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Delivery Settings</h2>
            <p className="text-gray-600 mt-1">Manage delivery charges and free delivery settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchSettings}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!settings && (
              <Button
                onClick={initializeSettings}
                disabled={initializing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="h-4 w-4" />
                {initializing ? 'Initializing...' : 'Initialize Default Settings'}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !settings ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Delivery Settings Found</h3>
              <p className="text-gray-600 text-center mb-6">
                Initialize default delivery settings to get started with delivery management.
              </p>
              <Button
                onClick={initializeSettings}
                disabled={initializing}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {initializing ? 'Initializing...' : 'Initialize Default Settings'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Current Settings Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Current Settings Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{settings.freeDeliveryMinAmount}</div>
                    <div className="text-sm text-gray-600">Free Delivery Above</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{settings.freeDeliveryRadius} km</div>
                    <div className="text-sm text-gray-600">Free Delivery Radius</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₹{settings.baseDeliveryCharge}</div>
                    <div className="text-sm text-gray-600">Base Charge</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{settings.perKmCharge}/km</div>
                    <div className="text-sm text-gray-600">Per KM Charge</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last updated: {new Date(settings.updatedAt!).toLocaleString()}</span>
                  <Badge variant={settings.codExtraCharges ? "default" : "secondary"}>
                    COD Extra Charges {settings.codExtraCharges ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Settings Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Free Delivery Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Free Delivery Settings
                  </CardTitle>
                  <CardDescription>
                    Configure when customers qualify for free delivery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="freeDeliveryMinAmount">Minimum Order Amount (₹)</Label>
                    <Input
                      id="freeDeliveryMinAmount"
                      type="number"
                      value={formData.freeDeliveryMinAmount}
                      onChange={(e) => handleInputChange('freeDeliveryMinAmount', Number(e.target.value))}
                      className={errors.freeDeliveryMinAmount ? 'border-red-500' : ''}
                    />
                    {errors.freeDeliveryMinAmount && (
                      <p className="text-sm text-red-500 mt-1">{errors.freeDeliveryMinAmount}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="freeDeliveryRadius">Free Delivery Radius (km)</Label>
                    <Input
                      id="freeDeliveryRadius"
                      type="number"
                      step="0.1"
                      value={formData.freeDeliveryRadius}
                      onChange={(e) => handleInputChange('freeDeliveryRadius', Number(e.target.value))}
                      className={errors.freeDeliveryRadius ? 'border-red-500' : ''}
                    />
                    {errors.freeDeliveryRadius && (
                      <p className="text-sm text-red-500 mt-1">{errors.freeDeliveryRadius}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Customers within this radius from warehouse get free delivery if order amount qualifies
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Charges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Delivery Charges
                  </CardTitle>
                  <CardDescription>
                    Set base charges and per kilometer rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="baseDeliveryCharge">Base Delivery Charge (₹)</Label>
                    <Input
                      id="baseDeliveryCharge"
                      type="number"
                      value={formData.baseDeliveryCharge}
                      onChange={(e) => handleInputChange('baseDeliveryCharge', Number(e.target.value))}
                      className={errors.baseDeliveryCharge ? 'border-red-500' : ''}
                    />
                    {errors.baseDeliveryCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.baseDeliveryCharge}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="perKmCharge">Per KM Charge (₹)</Label>
                    <Input
                      id="perKmCharge"
                      type="number"
                      step="0.1"
                      value={formData.perKmCharge}
                      onChange={(e) => handleInputChange('perKmCharge', Number(e.target.value))}
                      className={errors.perKmCharge ? 'border-red-500' : ''}
                    />
                    {errors.perKmCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.perKmCharge}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Additional charge per kilometer beyond free delivery radius
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Charge Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Delivery Charge Limits & COD Charges
                  </CardTitle>
                  <CardDescription>
                    Set charge limits and payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="minimumDeliveryCharge">Minimum Delivery Charge (₹)</Label>
                    <Input
                      id="minimumDeliveryCharge"
                      type="number"
                      value={formData.minimumDeliveryCharge}
                      onChange={(e) => handleInputChange('minimumDeliveryCharge', Number(e.target.value))}
                      className={errors.minimumDeliveryCharge ? 'border-red-500' : ''}
                    />
                    {errors.minimumDeliveryCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.minimumDeliveryCharge}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="maximumDeliveryCharge">Maximum Delivery Charge (₹)</Label>
                    <Input
                      id="maximumDeliveryCharge"
                      type="number"
                      value={formData.maximumDeliveryCharge}
                      onChange={(e) => handleInputChange('maximumDeliveryCharge', Number(e.target.value))}
                      className={errors.maximumDeliveryCharge ? 'border-red-500' : ''}
                    />
                    {errors.maximumDeliveryCharge && (
                      <p className="text-sm text-red-500 mt-1">{errors.maximumDeliveryCharge}</p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${formData.codExtraCharges ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <CreditCard className={`h-5 w-5 ${formData.codExtraCharges ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">COD Extra Charges</Label>
                        <p className={`text-xs ${formData.codExtraCharges ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formData.codExtraCharges ? 'Extra charges applied' : 'No extra charges'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.codExtraCharges}
                      onCheckedChange={(checked) => handleInputChange('codExtraCharges', checked)}
                      className={`${formData.codExtraCharges ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Charge Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Delivery Charge Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate delivery charges based on distance and order amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="distance">Distance (km)</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.1"
                        placeholder="Enter distance in kilometers"
                        className="mt-1"
                        onChange={(e) => {
                          const distance = Number(e.target.value);
                          const orderAmount = Number((document.getElementById('orderAmount') as HTMLInputElement)?.value);
                          calculateDeliveryCharge(distance, orderAmount);
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="orderAmount">Order Amount (₹)</Label>
                      <Input
                        id="orderAmount"
                        type="number"
                        placeholder="Enter order amount"
                        className="mt-1"
                        onChange={(e) => {
                          const orderAmount = Number(e.target.value);
                          const distance = Number((document.getElementById('distance') as HTMLInputElement)?.value);
                          calculateDeliveryCharge(distance, orderAmount);
                        }}
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          (document.getElementById('distance') as HTMLInputElement).value = '';
                          (document.getElementById('orderAmount') as HTMLInputElement).value = '';
                          updateCalculatorUI(0, 0);
                        }}
                        className="w-24"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Base Charge:</span>
                      <span className="font-medium">₹{formData.baseDeliveryCharge}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Distance Charge:</span>
                      <span id="distanceCharge" className="font-medium">₹0</span>
                    </div>
                    {formData.codExtraCharges && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">COD Extra Charge:</span>
                        <span className="font-medium text-orange-600">+₹20</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Delivery Charge:</span>
                      <span
                        id="totalCharge"
                        className="text-lg font-bold text-green-600 dark:text-green-400"
                      >
                        ₹0
                      </span>
                    </div>
                    <div
                      id="freeDeliveryMessage"
                      className="text-sm text-center py-2 rounded text-green-600 bg-green-100 dark:bg-green-900/30 hidden"
                    >
                      Eligible for free delivery!
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}