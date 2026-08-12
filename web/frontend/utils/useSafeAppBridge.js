import { useAppBridge } from "@shopify/app-bridge-react";

export function useSafeAppBridge() {
  try {
    const shopify = useAppBridge();
    if (shopify && shopify.toast) return shopify;
  } catch (e) {
    // Standalone / Vercel Mode: App Bridge not available
  }

  // Fallback mock shopify instance for Standalone Vercel preview
  return {
    toast: {
      show: (message, options) => {
        console.log(`[Toast ${options?.isError ? 'Error' : 'Success'}]:`, message);
      }
    }
  };
}
