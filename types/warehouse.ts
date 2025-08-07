export interface DeliverySettings {
  isDeliveryEnabled: boolean;
  disabledMessage: string;
  deliveryPincodes: string[];
  is24x7Delivery: boolean;
  deliveryDays: string[];
  deliveryHours: {
    start: string;
    end: string;
  };
}

export interface Warehouse {
  _id?: string;
  name: string;
  address: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  contactPhone: string;
  email: string;
  capacity: number;
  userId?: string;
  status?: 'active' | 'inactive';
  deliverySettings: DeliverySettings;
}

export const defaultWarehouse: Warehouse = {
  name: "",
  address: "",
  location: { lat: null, lng: null },
  contactPhone: "",
  email: "",
  capacity: 0,
  deliverySettings: {
    isDeliveryEnabled: true,
    disabledMessage: "",
    deliveryPincodes: [],
    is24x7Delivery: true,
    deliveryDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    deliveryHours: {
      start: "09:00",
      end: "18:00"
    }
  }
};
