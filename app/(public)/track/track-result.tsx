"use client";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-amber-100 text-amber-800",
  PRINTING: "bg-amber-100 text-amber-800",
  QUALITY_CHECK: "bg-amber-100 text-amber-800",
  READY_FOR_COLLECTION: "bg-green-100 text-green-800",
  SHIPPED: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-700",
};

interface TrackResultProps {
  data: {
    order: {
      orderNumber: string;
      status: string;
      placedAt: string;
      itemCount: number;
      total: number;
      estimatedDelivery: string | null;
      deliveryType: string;
      trackingNumber?: string;
      courier?: { name: string; phone?: string; trackingUrl?: string };
    };
    events: Array<{
      status: string;
      title: string;
      description: string | null;
      location: string | null;
      courierRef: string | null;
      createdAt: string;
    }>;
  };
}

export function TrackResult({ data }: TrackResultProps) {
  const { order, events } = data;
  const statusClass = STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="mt-8 border border-slate-200 rounded-xl p-6 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-lg">
          Order {order.orderNumber}
        </h2>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
        >
          {order.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-sm text-slate-500 mt-1">
        Placed: {new Date(order.placedAt).toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}{" "}
        · {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} · KES{" "}
        {Number(order.total).toLocaleString()}
      </p>

      {(order.trackingNumber || order.courier) && (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
          {order.trackingNumber && (
            <p className="text-sm">
              <strong>Tracking number:</strong> <span className="font-mono">{order.trackingNumber}</span>
            </p>
          )}
          {order.courier && (
            <>
              <p className="text-sm">
                <strong>Courier:</strong> {order.courier.name}
                {order.courier.phone && (
                  <> · <a href={`tel:${order.courier.phone}`} className="text-primary hover:underline">{order.courier.phone}</a></>
                )}
              </p>
              {order.courier.trackingUrl && order.trackingNumber && (
                <a
                  href={order.courier.trackingUrl.replace(/\{trackingNumber\}/gi, encodeURIComponent(order.trackingNumber))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Track with {order.courier.name} →
                </a>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-6 relative">
        {events.map((event, i) => {
          const isFirst = i === 0;
          const isLast = i === events.length - 1;
          return (
            <div key={event.createdAt + event.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${
                    isFirst ? "bg-orange-500" : "bg-slate-300"
                  }`}
                />
                {!isLast && (
                  <div className="w-px flex-1 min-h-[24px] bg-slate-200 my-0.5" />
                )}
              </div>
              <div className="pb-6">
                <p className={`font-medium ${isFirst ? "text-orange-700" : "text-slate-700"}`}>
                  {event.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(event.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {event.description && (
                  <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                )}
                {event.courierRef && (
                  <p className="text-sm text-slate-600 mt-1">
                    Courier ref: {event.courierRef}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {order.estimatedDelivery && (
        <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
          <strong>Estimated delivery:</strong>{" "}
          {new Date(order.estimatedDelivery).toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {order.deliveryType}
        </p>
      )}
    </div>
  );
}
