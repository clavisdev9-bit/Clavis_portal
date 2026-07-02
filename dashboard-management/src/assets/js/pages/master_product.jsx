const { useEffect, useState, useRef } = React;

const Product = () => {
  const tableRef = useRef();
  const [summary, setSummary] = useState(null);
  const [productData, setProductData] = useState([]);
  const columns = [
    { label: "thumbnail", index: 2, default: true },
    { label: "item_name", index: 3, default: true },
    { label: "sku", index: 4, default: true },
    { label: "barcode", index: 5, default: true },
    { label: "category_name", index: 6, default: true },
    { label: "price", index: 7, default: true },
    { label: "stock", index: 8, default: true },
    { label: "total_composition", index: 9, default: true },
    { label: "varian_count", index: 10, default: true },
    { label: "channel_count", index: 11, default: true },
  ];
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showColumn, setShowColumn] = useState(false);
  const chunkSize = Math.ceil(columns.length / 3);

  const col1 = columns.slice(0, chunkSize);
  const col2 = columns.slice(chunkSize, chunkSize * 2);
  const col3 = columns.slice(chunkSize * 2);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.filter((col) => col.default).map((col) => col.index),
  );
  const allColumnIndexes = columns.map((col) => col.index);

  const isAllChecked = visibleColumns.length === columns.length;
  const filterRef = useRef(null);
  const defaultColumns = [2, 3, 4, 5, 6, 7];
  const lockedColumns = [2, 3];

  const formatNumber = (val) => {
    if (val === undefined || val === null) return "-";
    return Number(val).toLocaleString("en-US");
  };

  const formatCurrency = (value) => {
    if (value == null) return "-";
    return (
      "Rp." +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)
    );
  };

  const getStatusStok = (qty) => {
    const n = Number(qty);
    if (n < 0) return { label: "Stok Menipis", cls: "bg-red-100 text-red-700" };
    if (n < 10)
      return { label: "Stok Menipis", cls: "bg-amber-100 text-amber-700" };
    return { label: "Tersedia", cls: "bg-green-100 text-green-700" };
  };

  const renderCodeWithStatus = (code, row) => {
    const isBundle = !!row.is_bundle;
    const isConsignment = !!row.is_consignment;
    const bundleIcon = isBundle
      ? `<i class="ri-gift-2-fill js-tooltip" data-tooltip="Bundle" style="color:#10b981; margin-left:6px; cursor:default; line-height:1; vertical-align:middle; display:inline-block;"></i>`
      : "";
    const consignmentIcon = isConsignment
      ? `<i class="ri-shake-hands-fill js-tooltip" data-tooltip="Consignment" style="color:#3b82f6; margin-left:2px; cursor:default; line-height:1; vertical-align:middle; display:inline-block;"></i>`
      : "";
    return `
        <div style="display:flex; align-items:flex-start; gap:2px;">
            <span style="white-space:normal; word-break:break-word; overflow-wrap:break-word; display:inline-block;">${code || "-"}</span>
            <span style="display:inline-flex; flex-shrink:0; gap:1px;">${bundleIcon}${consignmentIcon}</span>
        </div>
    `;
  };

  const renderVariantTableHtml = (variants) => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return `<div class="p-3 text-sm text-gray-500 italic">Not Available</div>`;
    }
    const rowsHtml = variants
      .map((v, i) => {
        const status = getStatusStok(v.available_qty);
        const variationHtml =
          Array.isArray(v.variation_values) && v.variation_values.length > 0
            ? `<div style="margin-top:4px; display:flex; flex-wrap:wrap; gap:4px;">
                ${v.variation_values
                  .map(
                    (vv) =>
                      `<span style="font-size:11px; background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:9999px;">${vv.label}: ${vv.value}</span>`,
                  )
                  .join("")}
              </div>`
            : "";

        return `
        <tr>
          <td class="px-3 py-2 text-center border-t border-gray-200" style="width:40px;">${i + 1}</td>
          <td class="px-3 py-2 border-t border-gray-200" style="width:80px;">
            <img src="${v.thumbnail || ""}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" onerror="this.onerror=null;this.src='';this.alt='No Image';" />
          </td>
          <td class="px-3 py-2 border-t border-gray-200">${v.item_code || v.sku || "-"}</td>
          <td class="px-3 py-2 border-t border-gray-200" style="white-space:normal; word-break:break-word; overflow-wrap:break-word;">
            ${v.item_name || "-"}
            ${variationHtml}
          </td>
          <td class="px-3 py-2 border-t border-gray-200">${v.barcode || "-"}</td>
          <td class="px-3 py-2 border-t border-gray-200">${formatNumber(v.available_qty)}</td>
          <td class="px-3 py-2 border-t border-gray-200">${formatNumber(v.order_qty)}</td>
          <td class="px-3 py-2 border-t border-gray-200">${formatCurrency(v.sell_price)}</td>
          <td class="px-3 py-2 border-t border-gray-200">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}">${status.label}</span>
          </td>
        </tr>
      `;
      })
      .join("");

    return `
    <div class="p-3" style="overflow:hidden;">
      <div class="border border-gray-300 rounded-md w-full" style="overflow-x:auto;">
        <table class="text-sm border-collapse" style="width:100%; min-width:900px; table-layout:fixed;">
          <colgroup>
            <col style="width:50px;" />
            <col style="width:100px;" />
            <col style="width:170px;" />
            <col style="width:600px;" />
            <col style="width:150px;" />
            <col style="width:130px;" />
            <col style="width:140px;" />
            <col style="width:150px;" />
          </colgroup>
          <thead>
            <tr style="background-color:#0d2b5e;">
              <th class="px-3 py-2 text-center" style="color:#fff;">No</th>
              <th class="px-3 py-2 text-left" style="color:#fff;">Thumbnail</th>
              <th class="px-3 py-2 text-left" style="color:#fff;">Item Code</th>
              <th class="px-3 py-2 text-left" style="color:#fff;">Item Name</th>
              <th class="px-3 py-2 text-left" style="color:#fff;">Barcode</th>
              <th class="px-3 py-2 text-right" style="color:#fff;">Quantity</th>
              <th class="px-3 py-2 text-right" style="color:#fff;">Order Qty</th>
              <th class="px-3 py-2 text-right" style="color:#fff;">Selling Price</th>
              <th class="px-3 py-2 text-left" style="color:#fff;">Stock Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
  };

  const toggleColumn = (index) => {
    if (lockedColumns.includes(index)) return;
    const table = tableRef.current;
    if (!table) return;

    const columnIndex = index - 1;
    const isVisible = table.column(columnIndex).visible();
    table.column(columnIndex).visible(!isVisible);

    setVisibleColumns((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleAllColumns = () => {
    const table = tableRef.current;
    if (!table) return;

    if (isAllChecked) {
      columns.forEach((col) => {
        const shouldShow = defaultColumns.includes(col.index);
        table.column(col.index - 1).visible(shouldShow);
      });
      setVisibleColumns(defaultColumns);
    } else {
      columns.forEach((col) => table.column(col.index - 1).visible(true));
      setVisibleColumns(allColumnIndexes);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowColumn(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderDetailRowHtml = (data, colspan) => {
    const rows = [
      ["Thumbnail", data.thumbnail],
      ["Item Name", data.item_name],
      ["Sku", data.sku],
      ["Barcode", data.barcode],
      ["Category", data.category_name],
      ["Price", data.price],
      ["Stock", data.stock],
      ["Total Composition", data.total_composition],
      ["Variant Count", data.variant_count],
      ["Channel Count", data.channel_count],
    ];

    const rowsHtml = rows
      .map(([label, value], idx) => {
        const safeValue = value || value === 0 ? String(value) : "-";
        return `
        <tr>
          <td class="px-3 py-2 border-t border-gray-300 text-center" style="width:50px;">${idx + 1}</td>
          <td class="px-3 py-2 font-medium border-t border-gray-300" style="width:220px;">${label}</td>
          <td class="px-3 py-2 border-t border-gray-300" style="white-space:normal; word-break:break-word; overflow-wrap:break-word;">${safeValue}</td>
        </tr>
      `;
      })
      .join("");

    return `
    <td colspan="${colspan}" class="p-3" style="overflow:hidden;">
      <div class="border border-gray-400 rounded-md overflow-hidden w-full">
        <table class="w-full text-sm border-collapse" style="table-layout:fixed;">
          <thead>
            <tr>
              <th class="text-left px-3 py-2 font-semibold border-b border-gray-300 text-center" style="width:50px;">No</th>
              <th class="text-left px-3 py-2 font-semibold border-b border-gray-300" style="width:220px;">Field</th>
              <th class="text-left px-3 py-2 font-semibold border-b border-gray-300">Value</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </td>
  `;
  };

  const renderLoadingRowHtml = (colspan) => `
  <td colspan="${colspan}" class="p-4 text-center text-slate-400">
    <i class="ri-loader-4-line animate-spin"></i> Memuat detail...
  </td>
`;

  const renderErrorRowHtml = (colspan, message) => `
  <td colspan="${colspan}" class="p-4 text-center text-red-500">
    Gagal memuat detail${message ? ": " + message : ""}
  </td>
`;

  const getChannelLogo = (name = "") => {
    const n = name.toLowerCase();
    const domains = [
      { match: "shop |", domain: "tiktokshop.com" },
      { match: "shopee", domain: "shopee.co.id" },
      { match: "tokopedia", domain: "tokopedia.com" },
    ];
    const found = domains.find((d) => n.includes(d.match));
    const domain = found ? found.domain : null;
    return domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      : "";
  };

  const cleanChannelName = (name = "") => {
    if (!name) return "-";
    const parts = name.split(" - ").map((p) => p.trim());
    const isAllSame = parts.every((p) => p === parts[0]);
    return isAllSame ? parts[0] : name;
  };

  useEffect(() => {
    let tooltip = document.getElementById("global-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "global-tooltip";
      document.body.appendChild(tooltip);
    }
    Object.assign(tooltip.style, {
      position: "fixed",
      color: "#000",
      padding: "2px 6px",
      border: "none",
      borderRadius: "4px",
      fontSize: "11px",
      lineHeight: "1.2",
      maxWidth: "180px",
      whiteSpace: "normal",
      wordBreak: "break-word",
      overflowWrap: "break-word",
      boxShadow: "none",
      zIndex: "99999",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.1s ease",
    });
    const GAP = 1;
    const handleMouseOver = (e) => {
      const target = e.target.closest(".js-tooltip");
      if (!target) return;

      const text = target.getAttribute("data-tooltip");
      if (!text) return;

      const isDarkMode = document.documentElement.classList.contains("dark");
      tooltip.style.color = isDarkMode ? "#fff" : "#000";

      tooltip.textContent = text;
      tooltip.style.opacity = "1";

      const rect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let top = rect.top - tooltipRect.height - GAP;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

      if (top < 4) {
        top = rect.bottom + GAP;
      }
      if (top + tooltipRect.height > window.innerHeight - 4) {
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + GAP;
        if (left + tooltipRect.width > window.innerWidth - 4) {
          left = rect.left - tooltipRect.width - GAP;
        }
      }
      if (left < 4) left = 4;
      if (left + tooltipRect.width > window.innerWidth - 4) {
        left = window.innerWidth - tooltipRect.width - 4;
      }
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };
    const handleMouseOut = (e) => {
      const target = e.target.closest(".js-tooltip");
      if (!target) return;
      tooltip.style.opacity = "0";
    };
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  useEffect(() => {
    let popup = document.getElementById("channel-popup-box");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "channel-popup-box";
      document.body.appendChild(popup);
    }
    Object.assign(popup.style, {
      position: "fixed",
      backgroundColor: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      padding: "10px",
      zIndex: "999999",
      minWidth: "260px",
      maxWidth: "320px",
      maxHeight: "260px",
      overflowY: "auto",
      display: "none",
    });
    let activeButton = null;

    const closePopup = () => {
      popup.style.display = "none";
      if (activeButton) activeButton.classList.remove("channel-active");
      activeButton = null;
    };

    const handleDocumentClick = (e) => {
      const btn = e.target.closest(".btn-channel");

      if (!btn) {
        if (!popup.contains(e.target)) closePopup();
        return;
      }
      e.stopPropagation();
      const table = tableRef.current;
      if (!table) return;

      if (activeButton === btn) {
        closePopup();
        return;
      }
      const tr = btn.closest("tr");
      const rowData = table.row(tr).data();
      const channels = Array.isArray(rowData && rowData.channels)
        ? rowData.channels
        : [];

      popup.innerHTML = channels.length
        ? channels
            .map((c) => {
              const logoUrl = getChannelLogo(c.store_name || "");
              const displayName = cleanChannelName(c.store_name || "");
              const logoHtml = logoUrl
                ? `<img src="${logoUrl}" style="width:20px;height:20px;object-fit:contain;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none';" />`
                : `<i class="ri-store-2-line" style="color:#94a3b8; font-size:16px; flex-shrink:0;"></i>`;

              return `
        <a href="${c.channel_url || "#"}" target="_blank" rel="noopener noreferrer"
           style="display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; text-decoration:none; color:#334155;">
          ${logoHtml}
          <span style="font-size:13px; word-break:break-word; flex:1;">${displayName}</span>
          <i class="ri-external-link-line" style="color:#94a3b8; flex-shrink:0;"></i>
        </a>
      `;
            })
            .join("")
        : `<span style="font-size:13px; color:#6b7280;">Tidak ada channel</span>`;

      const rect = btn.getBoundingClientRect();
      const popupWidth = 280;
      const popupHeight = 260;
      const margin = 16;
      let left = rect.right + 10;
      let top = rect.top;
      if (left + popupWidth > window.innerWidth - margin) {
        left = rect.left - popupWidth - 10;
      }
      if (top + popupHeight > window.innerHeight - margin) {
        top = window.innerHeight - popupHeight - margin;
      }
      if (top < margin) top = margin;

      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      popup.style.display = "block";

      activeButton = btn;
      btn.classList.add("channel-active");
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = `${__JUBELIO_URL__}/api/master-products`;

    axios
      .get(url)
      .then((res) => {
        const allData = res.data.data.data || [];
        const filtered = allData.filter((item) => {
          if (!item.created_at) return false;
          const createdDate = item.created_at.split(" ")[0];

          if (startDate && createdDate < startDate) return false;
          if (endDate && createdDate > endDate) return false;

          return true;
        });
        setProductData(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, [startDate, endDate]);

  useEffect(() => {
    if (!tableRef.current) {
      tableRef.current = $("#productTable").DataTable({
        data: productData,
        columns: [
          {
            data: null,
            title: "No",
            orderable: false,
            searchable: false,
            className: "sticky-col-left text-center",
            createdCell: function (td) {
              $(td).addClass("sticky-col-left");
            },
            render: function (_data, _type, _row, meta) {
              return meta.row + 1;
            },
          },
          {
            data: "thumbnail",
            title: "Thumbnail",
            render: function (data, type, row) {
              if (type === "display") {
                if (!data) return "-";
                return `<img src="${data}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.onerror=null;this.src='';this.alt='No Image';" />`;
              }
              return data;
            },
          },
          {
            data: "item_name",
            title: "Item Name",
            autoWidth: false,
            render: function (data, type, row) {
              if (type === "display") {
                return renderCodeWithStatus(data, row);
              }
              return data;
            },
          },
          { data: "sku", title: "SKU" },
          { data: "barcode", title: "Barcode" },
          { data: "category_name", title: "Category" },
          {
            data: "price",
            title: "Price",
            render: function (data) {
              return formatCurrency(data);
            },
          },
          { data: "stock", title: "Stock" },
          { data: "total_composition", title: "Total Composition" },
          { data: "variant_count", title: "Variant Count" },
          { data: "channel_count", title: "Channel Count" },
          {
            data: null,
            title: "Actions",
            orderable: false,
            searchable: false,
            className: "sticky-col-right text-center",
            render: function (_data, _type, row) {
              const channelCount = Array.isArray(row.channels)
                ? row.channels.length
                : row.channel_count || 0;
              const variantCount = Array.isArray(row.variants)
                ? row.variants.length
                : row.variant_count || 0;

              return `
                <button
                  class="btn-channel relative text-slate-600 hover:text-blue-600 text-lg"
                >
                  <i class="ri-information-line js-tooltip" data-tooltip="${channelCount} channel"></i>
                </button>
                <button
                  class="btn-variant relative text-slate-600 hover:text-blue-600 text-lg"
                >
                  <i class="ri-stack-line js-tooltip" data-tooltip="${variantCount} variant"></i>
                </button>
              `;
            },
          },
        ],
        columnDefs: [
          ...columns.map((col, i) => ({
            targets: i + 1,
            visible: col.default,
          })),
        ],
        scrollX: true,
      });
      $("#productTable tbody").on("click", ".btn-variant", function () {
        const table = tableRef.current;
        if (!table) return;

        const tr = $(this).closest("tr");
        const row = table.row(tr);
        const rowData = row.data();
        const variants = Array.isArray(rowData && rowData.variants)
          ? rowData.variants
          : [];

        if (row.child.isShown()) {
          row.child.hide();
          tr.removeClass("shown");
        } else {
          row.child(renderVariantTableHtml(variants)).show();
          tr.addClass("shown");
        }
      });
    } else {
      tableRef.current.clear();
      tableRef.current.rows.add(productData);
      tableRef.current.draw();
      tableRef.current.columns.adjust();
    }
  }, [productData]);

  return (
    <div>
      <div class="card m-5 p-0">
        <div class="border-b border-gray-300 dark:border-slate-700 p-4 font-bold">
          <i class="ri-filter-line"></i> Filter Panel
        </div>
        <div class="grid grid-cols-4 p-4 gap-4">
          <div class="flex flex-col">
            <label class="pb-2 font-medium">Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const value = e.target.value;
                if (endDate && value > endDate) {
                  alert("Start Date tidak boleh melebihi End Date");
                  return;
                }
                setStartDate(value);
              }}
              class="border border-gray-300 rounded-md dark:bg-dark date-input"
            />
          </div>
          <div class="flex flex-col">
            <label class="pb-2 font-medium">Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const value = e.target.value;
                if (startDate && value < startDate) {
                  alert("End Date tidak boleh kurang dari Start Date");
                  return;
                }
                setEndDate(value);
              }}
              class="border border-gray-300 rounded-md dark:bg-dark date-input"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-4 m-5 mt-0">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 2xl:col-span-12 order-[17] card card">
            <div class="grid grid-cols-2 content-between mb-2">
              <h4 class="font-semibold pt-1">Product Report</h4>
              <div class="flex justify-end gap-1" ref={filterRef}>
                <div className="relative" style={{ zIndex: 9999 }}>
                  <button
                    onClick={() => setShowColumn(!showColumn)}
                    class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                  >
                    <i class="ri-layout-vertical-line text-md"></i> Columns
                  </button>
                  {showColumn && (
                    <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap dark:text-black">
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center border-b pb-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllChecked}
                            onChange={toggleAllColumns}
                            className="mr-2 cursor-pointer"
                          />
                          <span>Check All Columns</span>
                        </label>
                        <div className="flex gap-3">
                          <div className="flex-1 flex flex-col">
                            {col1.map((col) => (
                              <label
                                key={col.index}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.includes(col.index)}
                                  onChange={() => toggleColumn(col.index)}
                                  disabled={lockedColumns.includes(col.index)}
                                  className="mr-2 cursor-pointer"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex-1 flex flex-col">
                            {col2.map((col) => (
                              <label
                                key={col.index}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.includes(col.index)}
                                  onChange={() => toggleColumn(col.index)}
                                  className="mr-2 cursor-pointer"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex-1 flex flex-col">
                            {col3.map((col) => (
                              <label
                                key={col.index}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.includes(col.index)}
                                  onChange={() => toggleColumn(col.index)}
                                  className="mr-2 cursor-pointer"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="relative w-full">
              {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <i className="ri-loader-4-line animate-spin text-3xl"></i>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                </div>
              )}
              <div className={loading ? "blur-sm pointer-events-none" : ""}>
                <table id="productTable" className="min-w-full table-auto">
                  <thead className="text-left">
                    <tr>
                      <th>No</th>
                      {columns.map((col) => (
                        <th key={col.index}>{col.label}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const root = ReactDOM.createRoot(document.getElementById("master-product"));
root.render(<Product />);
