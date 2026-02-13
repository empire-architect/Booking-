import { SearchForm } from "@/components/search-form";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-8 text-white sm:p-12">
        <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
          LiteAPI-powered booking MVP
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Build and run your booking business faster.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
          Search by destination or vibe, compare rates, prebook, collect payment, and confirm bookings
          through a clean server-side LiteAPI flow.
        </p>
      </section>

      <SearchForm />
    </div>
  );
}
