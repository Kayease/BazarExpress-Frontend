// frontend/lib/stock-stream.ts
export type VariantStocks = Record<string, number>;

export type StockUpdate = {
  productId: string;
  stock: number;
  variantStocks: VariantStocks;
};

export type StockSnapshot = {
  stock: number;
  variantStocks: VariantStocks;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class StockStream {
  private source: EventSource | null = null;
  private callbacks = new Set<(u: StockUpdate) => void>();
  private cache = new Map<string, StockSnapshot>();

  init() {
    if (typeof window === 'undefined' || this.source) return;
    if (!API_BASE_URL) return;
    try {
      this.source = new EventSource(`${API_BASE_URL}/stock/stream`);
      this.source.addEventListener('stockUpdate', (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data);
          const { productId, stock, variantStocks } = data as StockUpdate;
          const normalized: StockUpdate = {
            productId,
            stock: Number(stock) || 0,
            variantStocks: variantStocks || {},
          };
          this.cache.set(productId, { stock: normalized.stock, variantStocks: normalized.variantStocks });
          this.callbacks.forEach(cb => cb(normalized));
        } catch {}
      });
      this.source.onerror = () => {
        try { this.source?.close(); } catch {}
        this.source = null;
        // retry after backoff
        setTimeout(() => this.init(), 3000);
      };
    } catch {}
  }

  subscribe(cb: (u: StockUpdate) => void) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  getAvailable(productId: string, variantId?: string): number | null {
    const snap = this.cache.get(productId);
    if (!snap) return null;
    if (variantId) {
      if (snap.variantStocks && Object.prototype.hasOwnProperty.call(snap.variantStocks, variantId)) {
        return Number(snap.variantStocks[variantId]) || 0;
      }
      return Number(snap.stock) || 0;
    }
    return Number(snap.stock) || 0;
  }

  seed(productId: string, stock: number, variantStocks?: VariantStocks) {
    const existing = this.cache.get(productId) || { stock: 0, variantStocks: {} };
    this.cache.set(productId, { stock, variantStocks: variantStocks || existing.variantStocks });
  }
}

export const stockStream = new StockStream();