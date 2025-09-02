import toast from "react-hot-toast";

export function showStockLimitToast(available: number) {
  if (available <= 0) {
    toast.error('Out of stock');
    return;
  }
  toast.error(`Only ${available} left.`, {
    duration: 4000,
  });
}


