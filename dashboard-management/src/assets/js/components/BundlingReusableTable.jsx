const { useEffect, useState, useRef } = React;

const BundlingReusableTable = ({
  item,
  formatNumber,
  formatCurrency,
  startIndex = 0,
}) => {
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const getStatusStok = (qty) => {
    const n = Number(qty);
    if (n < 0) {
      return {
        label: "Stok Menipis",
        cls: "bg-red-100 text-red-700",
      };
    }
    if (n < 10) {
      return {
        label: "Stok Menipis",
        cls: "bg-amber-100 text-amber-700",
      };
    }
    return {
      label: "Tersedia",
      cls: "bg-green-100 text-green-700",
    };
  };

  return (
    <div className="bg-white dark:bg-dark border-t border-b border-gray-200 dark:border-slate-700 px-4 py-3">
      <div className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-2 tracking-wide">
        DAFTAR PRODUK BUNDLING
      </div>

      {variants.length === 0 ? (
        <div className="text-sm text-gray-500 italic">Not Available</div>
      ) : (
        <div className="relative w-full">
          <table className="table-fixed min-w-[1200px] text-sm border-separate border-spacing-0">
            <colgroup>
              <col style={{ width: "50px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "320px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "130px" }} />
            </colgroup>

            <thead className="text-left" style={{ backgroundColor: "#0d2b5e" }}>
              <tr>
                <th className="text-white sticky left-0 bg-black dark:bg-blue-950 z-4">
                  No
                </th>
                <th className="px-3 py-2 text-white">Thumbnail</th>
                <th className="px-3 py-2 text-white">SKU</th>
                <th className="px-3 py-2 text-white">Item Name</th>
                <th className="px-3 py-2 text-white text-right">Quantity</th>
                <th className="px-3 py-2 text-white text-right">
                  OrderQuantity
                </th>
                <th className="px-3 py-2 text-white text-right">
                  Selling Price
                </th>
                <th className="px-3 py-2 text-white">Stock Status</th>
              </tr>
            </thead>

            <tbody>
              {variants.map((v, i) => {
                const status = getStatusStok(v.available_qty);

                return (
                  <tr key={v.id || i}>
                    {/* Kolom No sticky */}
                    <td className="sticky left-0 z-10 px-3 py-2 w-[60px] bg-gray-100 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
                      {startIndex + i + 1}
                    </td>

                    {/* Thumbnail */}
                    <td className="px-3 py-2">
                      <img
                        src={
                          v.thumbnail ||
                          "https://via.placeholder.com/50?text=No+Image"
                        }
                        alt={v.item_name}
                        className="w-12 h-12 rounded object-cover border"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/50?text=N/A";
                        }}
                      />
                    </td>

                    <td className="px-3 py-2">{v.item_code}</td>

                    <td className="px-3 py-2">
                      {v.item_name}

                      {Array.isArray(v.variation_values) &&
                        v.variation_values.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {v.variation_values.map((vv, vi) => (
                              <span
                                key={vi}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                              >
                                {vv.label}: {vv.value}
                              </span>
                            ))}
                          </div>
                        )}
                    </td>

                    <td className="px-3 py-2 text-right">
                      {formatNumber(v.available_qty)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      {formatNumber(v.order_qty)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      {formatCurrency(v.sell_price)}
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

window.BundlingReusableTable = BundlingReusableTable;
