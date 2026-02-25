import Swal from "sweetalert2";

const defaultOptions = {
  confirmButtonColor: "#2563eb",
  cancelButtonColor: "#64748b",
};

export const swal = {
  error: (text: string, title = "Error") =>
    Swal.fire({ ...defaultOptions, icon: "error", title, text }),

  success: (text: string, title = "Success", timer = 1500) =>
    Swal.fire({
      ...defaultOptions,
      icon: "success",
      title,
      text,
      timer,
      showConfirmButton: false,
    }),

  confirm: (options: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: "question" | "warning";
    confirmColor?: string;
  }) =>
    Swal.fire({
      ...defaultOptions,
      icon: options.icon ?? "question",
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? "Yes",
      cancelButtonText: options.cancelText ?? "Cancel",
      confirmButtonColor: options.confirmColor ?? defaultOptions.confirmButtonColor,
    }),
};

export default swal;
