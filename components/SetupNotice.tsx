export function SetupNotice() {
  return (
    <section className="border border-brick bg-white px-4 py-4 text-sm text-ink">
      <h2 className="text-base font-semibold">Chưa cấu hình Supabase</h2>
      <p className="mt-2 text-ink/75">
        Thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`, sau đó chạy SQL trong
        `supabase/schema.sql` trên Supabase.
      </p>
    </section>
  );
}
