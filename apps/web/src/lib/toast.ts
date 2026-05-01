type ToastType = "success" | "error" | "info";

type ToastCallback = (message: string, type: ToastType) => void;

let toastCallback: ToastCallback | null = null;

export function registerToast(cb: ToastCallback) {
  toastCallback = cb;
}

export function showToast(message: string, type: ToastType = "info") {
  if (toastCallback) {
    toastCallback(message, type);
  }
}
