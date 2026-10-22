// Halaman publik wajib statis: build gagal jika ada render per-request yang masuk.
export const ensureStatic = "navigation";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      {children}
    </div>
  );
}
