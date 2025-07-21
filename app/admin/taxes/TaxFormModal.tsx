"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector, RootState } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia"];
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

interface Tax {
  _id: any;
  id?: string;
  name: string;
  percentage: number;
  isInclusive: boolean;
  applicableFor: "product" | "shipping" | "both";
  country?: string;
  state?: string;
  description?: string;
  status: "active" | "inactive";
}

interface TaxFormModalProps {
  open: boolean;
  onClose: () => void;
  tax: Tax | null;
  onSuccess: () => void;
}

export default function TaxFormModal({ open, onClose, tax, onSuccess }: TaxFormModalProps) {
  const token = useAppSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Tax>({
    _id: "",
    name: "",
    percentage: 0,
    isInclusive: false,
    applicableFor: "product",
    country: "India",
    state: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (tax) {
      if (tax) {
        setForm({ ...tax });
      } else {
        setForm({
          _id: "",
          name: "",
          percentage: 0,
          isInclusive: false,
          applicableFor: "product",
          country: "India",
          state: "",
          description: "",
          status: "active",
        });
      }
    } else {
      setForm({
        _id: "",
        name: "",
        percentage: 0,
        isInclusive: false,
        applicableFor: "product",
        country: "India",
        state: "",
        description: "",
        status: "active",
      });
    }
  }, [tax, open]);

  const handleChange = (field: keyof Tax, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let method = "POST";
      let url = `${API_URL}/taxes`;
      let payload = { ...form };
      if (tax) {
        if (!form._id) {
          toast.error("Invalid tax ID for update.");
          setLoading(false);
          return;
        }
        method = "PUT";
        url = `${API_URL}/taxes/${form._id}`;
      } else {
        delete payload._id;
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save tax");
      toast.success(tax ? "Tax updated successfully" : "Tax added successfully");
      onSuccess();
    } catch (err) {
      toast.error("Failed to save tax");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg w-full p-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-codGray px-6 pt-6 pb-2">
            {tax ? "Edit Tax" : "Add Tax"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-5 bg-white rounded-b-xl px-6 pb-6 pt-2" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={form.name} onChange={e => handleChange("name", e.target.value)} required maxLength={50} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Percentage (%)</label>
            <Input type="number" value={form.percentage} onChange={e => handleChange("percentage", Number(e.target.value))} min={0} max={100} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Applicable For</label>
            <Select value={form.applicableFor} onValueChange={v => handleChange("applicableFor", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-amber-50">
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <Select value={form.country} onValueChange={v => handleChange("country", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-amber-50">
                {COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.country === "India" && (
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <Select value={form.state} onValueChange={v => handleChange("state", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-amber-50">
                  {INDIAN_STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} maxLength={200} />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 py-2 px-3 rounded-lg border border-gray-100 mt-2 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <Switch
                checked={form.isInclusive}
                onCheckedChange={v => handleChange("isInclusive", v)}
                id="inclusive-switch"
                className={form.isInclusive ? "data-[state=checked]:bg-blue-600" : "data-[state=unchecked]:bg-gray-300"}
              />
              <label htmlFor="inclusive-switch" className="text-sm font-medium cursor-pointer select-none">
                Inclusive
              </label>
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold transition-colors duration-200 ${
                  form.isInclusive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-400 border border-gray-200"
                }`}
              >
                {form.isInclusive ? "Tax is included in price" : "Tax is added on top"}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <Switch
                checked={form.status === "active"}
                onCheckedChange={v => handleChange("status", v ? "active" : "inactive")}
                id="active-switch"
                className={form.status === "active" ? "data-[state=checked]:bg-green-600" : "data-[state=unchecked]:bg-gray-300"}
              />
              <label htmlFor="active-switch" className="text-sm font-medium cursor-pointer select-none">
                Active
              </label>
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold transition-colors duration-200 ${
                  form.status === "active"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-400 border border-gray-200"
                }`}
              >
                {form.status === "active" ? "Tax is enabled" : "Tax is disabled"}
              </span>
            </div>
          </div>
          <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {tax ? "Update Tax" : "Add Tax"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 