import { useEffect, useState } from "react";

function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="w-full h-44 bg-gray-200 rounded mb-3" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState(null); // null = loading, [] = vacío

  useEffect(() => {
    // Ajusta baseURL si cambiaste el puerto/back
    fetch("http://127.0.0.1:8000/api/products/")
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black" />
            <span className="font-semibold text-lg">Galería del Artista</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a className="hover:underline" href="#">
              Obras
            </a>
            <a className="hover:underline" href="#">
              Contacto
            </a>
            <button className="px-3 py-1.5 rounded bg-black text-white text-sm">
              Carrito
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-blue-600">
          Tailwind funcionando 🚀
        </h1>

        <p className="text-gray-600 mt-2">
          Pinturas únicas: técnica, dimensiones y precio claros. Envío seguro.
        </p>
      </section>

      {/* Grid de productos */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {products === null ? (
          // Loading
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          // Vacío
          <div className="text-center text-gray-600">
            No hay obras disponibles todavía.
          </div>
        ) : (
          // Listado
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <article
                key={p.id}
                className="border rounded-lg p-4 hover:shadow transition"
              >
                {p.primary_image && (
                  <img
                    src={p.primary_image}
                    alt={p.title}
                    className="w-full h-44 object-cover rounded mb-3"
                  />
                )}
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-600">
                  {p.technique || "Técnica mixta"}
                </p>
                <p className="mt-1 font-bold">
                  {p.price} {p.currency || "SEK"}
                </p>
                <button className="mt-3 w-full px-3 py-2 rounded bg-black text-white">
                  Añadir al carrito
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Galería del Artista — Hecho con amor y
          café.
        </div>
      </footer>
    </div>
  );
}
