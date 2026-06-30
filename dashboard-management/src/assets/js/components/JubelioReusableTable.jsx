const { useEffect, useState, useRef } = React;

const JubelioReusableTable = ({
  title,
  endpoint,
  columns: initialColumns,
  elementId,
  showFilterPanel = true,
  filterFields = [],
  expandableField = "is_bundle",
  bundleBadgeField = "item_name",
  renderExpandedRow = null,
}) => {
  const [tableData, setTableData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const pageSizeOptions = [10, 25, 50, 100];
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState(initialColumns);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const filterRef = useRef(null);
  const channelPopupRef = useRef(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState(""); // search input terpisah dari debounced
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  const toggleExpand = (rowKey) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const toggleChannelPopup = (rowKey, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 280;
    const popupHeight = 250;
    const margin = 16;
    let left = rect.right + 10;
    let top = rect.top;
    if (left + popupWidth > window.innerWidth - margin) {
      left = rect.left - popupWidth - 10;
    }
    if (top + popupHeight > window.innerHeight - margin) {
      top = window.innerHeight - popupHeight - margin;
    }
    setPopupPosition({ top, left });
    setActiveChannelRow((prev) => (prev === rowKey ? null : rowKey));
  };

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  const isExpandableRow = (item) => {
    const flag = expandableField
      ? getNestedValue(item, expandableField)
      : false;
    const hasMultipleVariants =
      Array.isArray(item.variants) && item.variants.length > 1;
    const hasVariantCount = Number(item.variant_count) > 1;
    return Boolean(flag) || hasMultipleVariants || hasVariantCount;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedData = [...tableData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = getNestedValue(a, sortField) || "";
    const bVal = getNestedValue(b, sortField) || "";
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const fetchData = (page = 1) => {
    setLoading(true);
    axios
      .get(`${__JUBELIO_URL__}${endpoint}`, {
        params: {
          search: searchText,
          per_page: limit,
          page: page,
          date_from: dateFrom ? `${dateFrom} 00:00:00` : undefined,
          date_to: dateTo ? `${dateTo} 23:59:59` : undefined,
        },
      })
      .then((res) => {
        const resultData = res.data.data.data || [];
        setTableData(resultData);
        setTotal(
          res.data.data.total !== undefined
            ? res.data.data.total
            : resultData.length,
        );
        setCurrentPage(page);
        setExpandedRows(new Set());
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  useEffect(() => {
    fetchData(1);
  }, [dateFrom, dateTo]);

  const totalPages = Math.ceil(total / limit);

  const showingFrom = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const showingTo = Math.min(currentPage * limit, total);

  const getPagination = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }
    let last = 0;
    for (let i of range) {
      if (i - last > 1) rangeWithDots.push("...");
      rangeWithDots.push(i);
      last = i;
    }
    return rangeWithDots;
  };

  const pages = getPagination(currentPage, totalPages);
  const [hoveredChannelRow, setHoveredChannelRow] = useState(null);
  const [activeChannelRow, setActiveChannelRow] = useState(null);
  const [showColumn, setShowColumn] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowColumn(false);
      }
      if (
        channelPopupRef.current &&
        !channelPopupRef.current.contains(e.target)
      ) {
        setActiveChannelRow(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleColumns = columns.filter((col) => col.visible !== false);
  const selectableColumns = columns;
  const chunkSize = Math.ceil(selectableColumns.length / 3);
  const col1 = selectableColumns.slice(0, chunkSize);
  const col2 = selectableColumns.slice(chunkSize, chunkSize * 2);
  const col3 = selectableColumns.slice(chunkSize * 2);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRupiah = (value, options = {}) => {
    const {
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      rounding = "round",
    } = options;
    let number = Number(value) || 0;
    if (rounding === "ceil") number = Math.ceil(number * 100) / 100;
    else if (rounding === "floor") number = Math.floor(number * 100) / 100;
    else number = Math.round(number * 100) / 100;
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(number);
  };

  const formatCurrency = (value, currency = "IDR") => {
    if (value == null) return;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return;
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatBoolean = (value) => {
    const isTrue = value === true || value === "true" || value === 1;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${isTrue ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}
      >
        {isTrue ? "Yes" : "No"}
      </span>
    );
  };

  const formatImage = (value) => {
    if (!value) return "-";
    return (
      <img
        src={value}
        alt="thumbnail"
        className="w-12 h-12 object-cover rounded-md border border-gray-200"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/48?text=N/A";
        }}
      />
    );
  };

  const formatters = {
    date: formatDate,
    number: formatNumber,
    currency: formatCurrency,
    boolean: formatBoolean,
    image: formatImage,
  };

  const BundlingBadge = () => (
    <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 align-middle">
      <i className="ri-archive-2-line"></i> Bundling
    </span>
  );

  // ── Export helpers ──────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = visibleColumns.map((col) => col.label);
    const rows = tableData.map((item, index) => [
      (currentPage - 1) * limit + index + 1,
      ...visibleColumns.map((col) => {
        const val = getNestedValue(item, col.field);
        return val !== null && val !== undefined ? String(val) : "";
      }),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToXLSX = () => {
    if (typeof XLSX === "undefined") {
      alert("Library XLSX tidak tersedia.");
      return;
    }
    const headers = ["No", ...visibleColumns.map((col) => col.label)];
    const rows = tableData.map((item, index) => [
      (currentPage - 1) * limit + index + 1,
      ...visibleColumns.map((col) => {
        const val = getNestedValue(item, col.field);
        return val !== null && val !== undefined ? val : "";
      }),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${title || "export"}.xlsx`);
  };

  const exportToPDF = () => {
    if (typeof jspdf === "undefined" && typeof window.jspdf === "undefined") {
      alert("Library jsPDF tidak tersedia.");
      return;
    }
    const { jsPDF } = window.jspdf || jspdf;
    const doc = new jsPDF({ orientation: "landscape" });
    const headers = [["No", ...visibleColumns.map((col) => col.label)]];
    const rows = tableData.map((item, index) => [
      (currentPage - 1) * limit + index + 1,
      ...visibleColumns.map((col) => {
        const val = getNestedValue(item, col.field);
        return val !== null && val !== undefined ? String(val) : "";
      }),
    ]);
    doc.text(title || "Export", 14, 15);
    doc.autoTable({ head: headers, body: rows, startY: 20 });
    doc.save(`${title || "export"}.pdf`);
  };

  const printTable = () => {
    const headers = ["No", ...visibleColumns.map((col) => col.label)];
    const rows = tableData.map((item, index) => [
      (currentPage - 1) * limit + index + 1,
      ...visibleColumns.map((col) => {
        const val = getNestedValue(item, col.field);
        return val !== null && val !== undefined ? String(val) : "";
      }),
    ]);
    const tableHTML = `
      <html><head><title>${title || "Print"}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #0d2b5e; color: white; padding: 6px 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 6px 8px; }
        tr:nth-child(even) td { background: #f9f9f9; }
        h2 { margin-bottom: 8px; }
      </style></head><body>
      <h2>${title || ""}</h2>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(tableHTML);
    win.document.close();
    win.print();
  };
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="dark:bg-dark">
      {/* Filter Panel */}
      <div className="card m-5 p-0">
        <div className="border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 font-bold">
          <i className="ri-filter-line"></i> Filter Panel
        </div>
        <div className="grid grid-cols-4 p-4 gap-4">
          <div className="flex flex-col">
            <label className="pb-2 font-medium">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-md dark:bg-dark text-black dark:text-white date-input"
            />
          </div>
          <div className="flex flex-col">
            <label className="pb-2 font-medium">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-md dark:bg-dark text-black dark:text-white date-input"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 m-5 mt-0 min-h-[calc(100vh-212px)]">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 card relative overflow-visible">
            {/* ── Toolbar: Title + Export buttons + Columns ── */}
            <div className="grid grid-cols-2 content-between mb-3">
              <h4 className="font-semibold pt-1">{title}</h4>

              <div className="flex justify-end gap-1" ref={filterRef}>
                {/* Export buttons — sama persis dengan Purchase Order */}
                <button
                  onClick={exportToXLSX}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-file-excel-line text-md"></i> XLSX
                </button>
                <button
                  onClick={exportToPDF}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-file-pdf-2-line text-md"></i> PDF
                </button>
                <button
                  onClick={exportToCSV}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-file-hwp-line text-md"></i> CSV
                </button>
                <button
                  onClick={printTable}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-printer-line text-md"></i> PRINT
                </button>

                {/* Columns toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumn(!showColumn)}
                    className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                  >
                    <i className="ri-layout-vertical-line text-md"></i> Columns
                  </button>

                  {showColumn && (
                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-2xl p-4 z-[99999] max-h-[500px] overflow-y-auto inline-block min-w-max whitespace-nowrap">
                      <label className="flex items-center border-b pb-2 mb-2 font-semibold cursor-pointer text-black dark:text-black">
                        <input
                          type="checkbox"
                          className="mr-2 cursor-pointer"
                          checked={columns.every(
                            (col) => col.visible !== false,
                          )}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setColumns((prev) =>
                              prev.map((col) => ({
                                ...col,
                                visible: col.index <= 6 ? true : checked,
                              })),
                            );
                          }}
                        />
                        Check All Columns
                      </label>

                      <div className="flex gap-8 w-max">
                        {[col1, col2, col3].map((group, groupIndex) => (
                          <div
                            key={groupIndex}
                            className="flex flex-col pr-4 min-w-[220px]"
                          >
                            {group.map((col) => (
                              <label
                                key={col.index}
                                className="flex items-center gap-2 cursor-pointer text-black whitespace-nowrap"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 flex-shrink-0 cursor-pointer"
                                  checked={col.visible !== false}
                                  onChange={() => {
                                    setColumns((prev) =>
                                      prev.map((item) =>
                                        item.index === col.index
                                          ? { ...item, visible: !item.visible }
                                          : item,
                                      ),
                                    );
                                  }}
                                />
                                <span className="whitespace-nowrap">
                                  {col.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      appearance: "none",
                    }}
                    className="border border-gray-300 rounded-md pl-3 pr-7 py-1 w-20 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-dark"
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <i className="absolute right-2 text-gray-500 pointer-events-none text-sm"></i>
                </div>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Search:</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-dark"
                />
              </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto relative">
              {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-[2px] rounded-md">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white mb-3">
                    <i className="ri-loader-4-line animate-spin text-lg"></i>
                    Loading data...
                  </div>
                  <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-slate-700">
                    <div className="h-full bg-blue-600 animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              <table
                className={`table-fixed min-w-max transition-all duration-200 ${loading ? "blur-sm brightness-50 scale-[0.99] pointer-events-none select-none" : ""}`}
              >
                <colgroup>
                  <col style={{ width: "50px" }} />
                  {visibleColumns.map((col) => (
                    <col
                      key={col.index}
                      style={{ width: col.width || "200px" }}
                    />
                  ))}
                  <col style={{ width: "90px" }} />
                </colgroup>

                <thead
                  className="text-left"
                  style={{ backgroundColor: "#0d2b5e" }}
                >
                  <tr>
                    {/* No - warna sama dengan header lain */}
                    <th
                      className="text-white sticky left-0 z-4"
                      style={{ backgroundColor: "#0d2b5e" }}
                    >
                      No
                    </th>

                    {visibleColumns.map((col) => (
                      <th
                        key={col.index}
                        className="text-white cursor-pointer select-none"
                        onClick={() => handleSort(col.field)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <span className="flex flex-col leading-none text-[10px]">
                            <span
                              style={{
                                opacity:
                                  sortField === col.field && sortDir === "asc"
                                    ? 1
                                    : 0.35,
                              }}
                            >
                              ▲
                            </span>
                            <span
                              style={{
                                opacity:
                                  sortField === col.field && sortDir === "desc"
                                    ? 1
                                    : 0.35,
                              }}
                            >
                              ▼
                            </span>
                          </span>
                        </div>
                      </th>
                    ))}

                    {/* Actions - warna sama dengan header lain */}
                    <th
                      className="text-white sticky right-0 z-10 min-w-[90px]"
                      style={{ backgroundColor: "#0d2b5e" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedData.map((item, index) => {
                    const rowKey =
                      item.id !== undefined && item.id !== null
                        ? item.id
                        : index;
                    const expandable = isExpandableRow(item);
                    const isOpen = expandedRows.has(rowKey);

                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          className={`align-top ${expandable ? "cursor-pointer" : ""} ${isOpen ? "bg-blue-50 dark:bg-slate-700/40" : expandable ? "hover:bg-blue-50/60 dark:hover:bg-slate-700/30" : ""}`}
                          onClick={() => {
                            if (expandable) toggleExpand(rowKey);
                          }}
                        >
                          <td className="sticky left-0 bg-white dark:bg-dark z-4">
                            {(currentPage - 1) * limit + index + 1}
                          </td>

                          {visibleColumns.map((col) => {
                            const rawValue = getNestedValue(item, col.field);
                            const formatter = formatters[col.type];
                            const value = formatter
                              ? formatter(rawValue)
                              : rawValue;
                            const showBadgeHere =
                              expandable && col.field === bundleBadgeField;
                            return (
                              <td
                                key={col.index}
                                className={`px-3 py-2 align-top break-words whitespace-normal overflow-hidden ${col.className || ""}`}
                              >
                                {value}
                                {showBadgeHere && <BundlingBadge />}
                              </td>
                            );
                          })}

                          <td
                            className="sticky right-0 bg-white dark:bg-dark z-10 relative min-w-[150px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block">
                              <i
                                className="ri-information-line cursor-pointer text-lg"
                                onMouseEnter={() =>
                                  setHoveredChannelRow(rowKey)
                                }
                                onMouseLeave={() => setHoveredChannelRow(null)}
                                onClick={(e) => toggleChannelPopup(rowKey, e)}
                              ></i>
                              {hoveredChannelRow === rowKey &&
                                activeChannelRow !== rowKey && (
                                  <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs py-1 text-black z-50">
                                    {item.channels && item.channels.length > 0
                                      ? item.channels.length + " channel"
                                      : "Tidak ada channel"}
                                  </span>
                                )}
                              {activeChannelRow === rowKey && (
                                <div
                                  ref={channelPopupRef}
                                  className="fixed bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-2xl p-3 z-[999999]"
                                  style={{
                                    top: popupPosition.top,
                                    left: popupPosition.left,
                                    minWidth: "280px",
                                    maxWidth: "320px",
                                  }}
                                >
                                  {item.channels && item.channels.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                      {item.channels.map((channel, idx) => (
                                        <a
                                          key={idx}
                                          href={channel.channel_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-between px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                                        >
                                          <span className="text-sm text-gray-700 dark:text-white">
                                            {channel.store_name}
                                          </span>
                                          <i className="ri-external-link-line text-gray-400"></i>
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      Tidak ada channel
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandable && isOpen && (
                          <tr>
                            <td
                              colSpan={visibleColumns.length + 2}
                              className="p-0 overflow-visible bg-white dark:bg-dark"
                            >
                              {renderExpandedRow ? (
                                renderExpandedRow(item)
                              ) : (
                                <BundlingReusableTable
                                  item={item}
                                  formatNumber={formatNumber}
                                  formatCurrency={formatCurrency}
                                  startIndex={(currentPage - 1) * limit}
                                />
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-3 text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {total === 0
                  ? "Showing 0 entries"
                  : `Showing ${showingFrom} to ${showingTo} of ${total} entries`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === 1
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-400 text-black hover:bg-gray-100"
                  }`}
                >
                  Previous
                </button>

                {pages.map((p, index) => (
                  <button
                    key={index}
                    onClick={() => typeof p === "number" && fetchData(p)}
                    disabled={p === "..."}
                    style={{
                      backgroundColor: currentPage === p ? "#0d2b5e" : "white",
                      color: currentPage === p ? "white" : "#0d2b5e",
                    }}
                    className="px-3 py-1 rounded-md border border-gray-400 min-w-[36px]"
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === totalPages
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-400 text-black hover:bg-gray-100"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.JubelioReusableTable = JubelioReusableTable;