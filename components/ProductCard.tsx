import Link from "next/link";

type Props = {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url?: string | null;
};

export default function ProductCard(props: Props) {
  return (
    <Link
      href={`/products/${props.id}`}
      className="flex flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        {props.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.image_url}
            alt={props.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Nessuna immagine
          </div>
        )}
      </div>
      <div className="mt-3 flex-1">
        <h3 className="text-sm font-semibold">{props.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {props.description}
        </p>
      </div>
      <div className="mt-3 text-sm font-semibold">
        € {props.price.toFixed(2)}
      </div>
    </Link>
  );
}
