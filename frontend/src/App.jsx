import { useEffect, useMemo, useState } from "react";
import api from "./services/api";
import { useCart } from "./store/cart";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // === SELECTORES (mejor perf) ===
  const items = useCart((s) => s.items);
  const email = useCart((s) => s.email);
  const setEmail = useCart((s) => s.setEmail);
  const addItem = useCart((s) => s.addItem);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const incQty = useCart((s) => s.inc);
  const decQty = useCart((s) => s.dec);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products/")
      .then((r) => setProducts(r.data))
      .catch(() => setError("No pudimos cargar los productos."))
      .finally(() => setLoading(false));
  }, []);

  // Aviso al volver de Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid")) {
      alert("✅ Pago confirmado. ¡Gracias por tu compra!");
      window.history.replaceState({}, "", window.location.pathname);
      clear();
    }
    if (params.get("canceled")) {
      alert("❕ Pago cancelado. Puedes intentarlo nuevamente.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [clear]);

  // Subtotal calculado
  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.unit_price) * i.quantity, 0),
    [items]
  );

  const createOrderAndPay = async () => {
    if (!email) {
      alert("Ingresa tu email");
      return;
    }
    if (items.length === 0) return;

    try {
      const orderRes = await api.post("/orders/", { email, items });
      const order = orderRes.data;
      const payRes = await api.post("/checkout/create-session/", {
        order_id: order.id,
        success_url: "http://localhost:5173/?paid=1",
        cancel_url: "http://localhost:5173/?canceled=1",
      });
      window.location.href = payRes.data.url;
    } catch (e) {
      alert("Ocurrió un error iniciando el pago.");
      console.error(e);
    }
  };

  // Helpers finos para sumar/restar en UI (usan inc/dec del store)
  const inc = (item) => incQty(item.product_id, 1);
  const dec = (product_id) => decQty(product_id, 1);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Galería del Artista</h1>

      <div className="mb-6">
        <input
          className="border p-2 rounded w-full md:w-1/2"
          placeholder="Tu email para la compra"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="border rounded-lg p-4">
              {p.primary_image && (
                <img
                  src={p.primary_image}
                  alt={p.title}
                  className="mb-3 w-full h-48 object-cover rounded"
                />
              )}
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.technique}</p>
              <p className="mt-1 font-bold">
                {Number(p.price).toFixed(2)} {p.currency || "SEK"}
              </p>
              <button
                className="mt-3 px-3 py-2 rounded bg-black text-white w-full"
                onClick={() => addItem(p, 1)}
              >
                Añadir al carrito
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Carrito */}
      <div className="mt-10 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Carrito</h2>
        {items.length === 0 ? (
          <p>Vacío</p>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.product_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium">{i.title}</div>
                    <div className="text-sm text-gray-600">
                      {Number(i.unit_price).toFixed(2)} SEK c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() => dec(i.product_id)}
                    >
                      –
                    </button>
                    <span className="w-8 text-center">{i.quantity}</span>
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() => inc(i)}
                    >
                      +
                    </button>
                  </div>
                  <div className="w-24 text-right">
                    {(Number(i.unit_price) * i.quantity).toFixed(2)} SEK
                  </div>
                  <button
                    className="ml-3 text-sm text-red-600 hover:underline"
                    onClick={() => removeItem(i.product_id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-lg font-semibold">Subtotal</div>
              <div className="text-lg font-bold">{subtotal.toFixed(2)} SEK</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 rounded bg-gray-200" onClick={clear}>
                Vaciar
              </button>
              <button
                className={`px-3 py-2 rounded text-white ${
                  !email || items.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600"
                }`}
                disabled={!email || items.length === 0}
                onClick={createOrderAndPay}
              >
                Pagar con Stripe
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
