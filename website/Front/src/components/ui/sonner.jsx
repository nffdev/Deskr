import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border-white/[0.08] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-400",
        },
      }}
      {...props} />
  );
}

export { Toaster }
