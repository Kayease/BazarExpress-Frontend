"use client";

import { ChevronRight } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'wallet' | 'card' | 'netbanking' | 'upi' | 'cod';
  name: string;
  icon: any;
  description?: string;
  popular?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
  paymentMethods: PaymentMethod[];
  isCODAvailable: boolean;
}

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodSelect, 
  paymentMethods, 
  isCODAvailable 
}: PaymentMethodSelectorProps) {

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No payment methods available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => {
        const IconComponent = method.icon;
        const isCODDisabled = method.id === 'cod' && !isCODAvailable;

        return (
          <div
            key={method.id}
            onClick={() => !isCODDisabled && onMethodSelect(method.id)}
            className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
              isCODDisabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : selectedMethod === method.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === method.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{method.name}</h3>
                    {method.popular && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  {isCODDisabled && (
                    <p className="text-xs text-red-500 mt-1">
                      Not available for some items in your cart
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${
                selectedMethod === method.id ? 'rotate-90 text-green-500' : 'text-gray-400'
              }`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}