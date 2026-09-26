export default function CargandoEstudio() {
  return (
    <div className="space-y-4" aria-busy>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="card h-36 p-5">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton mt-4 h-8 w-28 rounded" />
            <div className="skeleton mt-6 h-8 w-full rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card h-80 xl:col-span-2">
          <div className="skeleton m-5 h-64 rounded-xl" />
        </div>
        <div className="card h-80">
          <div className="skeleton m-5 h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
