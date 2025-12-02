import Link from "next/link";

export default function OrderCompletedPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Ordine completato</h1>
      <p className="mt-2 text-sm text-slate-600">
        Il tuo ordine è stato registrato con successo (simulazione).
        Grazie per aver provato questa demo!
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Torna ai prodotti
      </Link>
    </div>
  );
}
