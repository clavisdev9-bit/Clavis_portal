const { useEffect, useState, useRef } = React;

const SupplierReusableTable = ({
  title,
  endpoint,
  columns: initialColumns,
  elementId,
}) => {
  const [allData, setAllData] = useState([]); // semua data dari backend
  const [searchText, setSearchText] = useState("");
  const [limit, setLimit] = useState(10);
  const pageSizeOptions = [10, 25, 50, 100];
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState(initialColumns);
  const [loading, setLoading] = useState(false);
  const [showColumn, setShowColumn] = useState(false);
  const filterRef = useRef(null);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Fetch SEKALI saja — ambil semua data, tidak perlu page/per_page ke backend
  const fetchData = () => {
    setLoading(true);

    axios
      .get(`${__JUBELIO_URL__}${endpoint}`)
      .then((res) => {
        const result = res.data;
        const dataArr = (result.data && result.data.data) || result.data || [];

        setAllData(Array.isArray(dataArr) ? dataArr : []);
        setCurrentPage(1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowColumn(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleColumns = columns.filter((col) => col.visible !== false);

  const chunkSize = Math.ceil(columns.length / 3);
  const col1 = columns.slice(0, chunkSize);
  const col2 = columns.slice(chunkSize, chunkSize * 2);
  const col3 = columns.slice(chunkSize * 2);

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ====== Filter berdasarkan search (client-side) ======
  const filteredData = allData.filter((item) => {
    if (!searchText.trim()) return true;
    const keyword = searchText.trim().toLowerCase();

    return visibleColumns.some((col) => {
      const val = getNestedValue(item, col.field);
      return val && String(val).toLowerCase().includes(keyword);
    });
  });

  // ====== Sort (client-side) ======
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = getNestedValue(a, sortField) || "";
    const bVal = getNestedValue(b, sortField) || "";
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ====== Pagination (client-side) — maksimal 10 data per halaman ======
  const total = sortedData.length;
  const totalPages = Math.ceil(total / limit);
  const startIdx = (currentPage - 1) * limit;
  const paginatedData = sortedData.slice(startIdx, startIdx + limit);

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
      if (i - last > 1) {
        rangeWithDots.push("...");
      }

      rangeWithDots.push(i);
      last = i;
    }

    return rangeWithDots;
  };

  const pages = getPagination(currentPage, totalPages);
  const showingFrom = total === 0 ? 0 : startIdx + 1;
  const showingTo = Math.min(startIdx + limit, total);

  // Reset ke halaman 1 setiap kali search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  // ====== Export helper — pakai paginatedData (data halaman aktif) ======
  const buildExportRows = () => {
    const headers = ["No", ...visibleColumns.map((col) => col.label)];

    const rows = paginatedData.map((item, index) => {
      const row = [startIdx + index + 1];

      visibleColumns.forEach((col) => {
        const rawValue = getNestedValue(item, col.field);
        const value =
          col.type === "date" ? formatDate(rawValue) : rawValue || "";

        row.push(value);
      });

      return row;
    });

    return { headers, rows };
  };

  const exportCSV = () => {
    const { headers, rows } = buildExportRows();
    const csvContent = [headers, ...rows]
      .map((r) =>
        r
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${title || "data"}.csv`;
    link.click();
  };

  const exportXLSX = () => {
    if (typeof XLSX === "undefined") {
      console.error("Library XLSX (SheetJS) belum di-load di HTML.");
      return;
    }

    const { headers, rows } = buildExportRows();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, title || "Sheet1");
    XLSX.writeFile(wb, `${title || "data"}.xlsx`);
  };

  const handlePrint = () => {
    const { headers, rows } = buildExportRows();
    const printWindow = window.open("", "_blank");

    const tableHtml = `
      <table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse:collapse; font-family:sans-serif;">
        <thead>
          <tr>${headers
            .map((h) => `<th style="background:#233a68;color:#fff;">${h}</th>`)
            .join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    `;

    printWindow.document.write(`
      <html>
        <head><title>${title}</title></head>
        <body>
          <h3>${title}</h3>
          ${tableHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div>
      {/* FILTER PANEL */}
      <div className="card m-5 p-0">
        <div className="border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 font-bold">
          <i className="ri-filter-line"></i> Filter Panel
        </div>

        <div className="grid grid-cols-4 p-4 gap-4">
          <div className="flex flex-col">
            <label className="pb-2 font-medium">Date From</label>
            <input
              type="date"
              className="border border-gray-300 rounded-md dark:bg-dark date-input"
            />
          </div>

          <div className="flex flex-col">
            <label className="pb-2 font-medium">Date To</label>
            <input
              type="date"
              className="border border-gray-300 rounded-md dark:bg-dark date-input"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex flex-col gap-4 m-5 mt-0 min-h-[calc(100vh-212px)]">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 2xl:col-span-12 order-[17] card">
            <div className="grid grid-cols-2 content-between mb-2">
              <h4 className="font-semibold pt-1">{title}</h4>

              <div className="flex justify-end gap-1" ref={filterRef}>
                <button
                  onClick={exportXLSX}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-file-excel-line text-md"></i> XLSX
                </button>

                <button
                  onClick={handlePrint}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-file-pdf-2-line text-md"></i> PDF
                </button>

                <button
                  onClick={exportCSV}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-file-hwp-line text-md"></i> CSV
                </button>

                <button
                  onClick={handlePrint}
                  className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                >
                  <i className="ri-printer-line text-md"></i> PRINT
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowColumn(!showColumn)}
                    className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                  >
                    <i className="ri-layout-vertical-line text-md"></i> Columns
                  </button>

                  {showColumn && (
                    <div className="absolute min-w-96 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap">
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center border-b pb-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columns.every(
                              (col) => col.visible !== false,
                            )}
                            onChange={(e) => {
                              const checked = e.target.checked;

                              setColumns((prev) =>
                                prev.map((col) => ({
                                  ...col,
                                  visible: checked,
                                })),
                              );
                            }}
                            className="mr-2 cursor-pointer"
                          />
                          <span>Check All Columns</span>
                        </label>

                        <div className="flex gap-3">
                          {[col1, col2, col3].map((group, index) => (
                            <div key={index} className="flex-1 flex flex-col">
                              {group.map((col) => (
                                <label
                                  key={col.index}
                                  className="flex items-center cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={col.visible !== false}
                                    onChange={() => {
                                      setColumns((prev) =>
                                        prev.map((item) =>
                                          item.index === col.index
                                            ? {
                                                ...item,
                                                visible: !item.visible,
                                              }
                                            : item,
                                        ),
                                      );
                                    }}
                                    className="mr-2 cursor-pointer"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3 px-1">
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

              <div className="flex items-center gap-2">
                <span>Search:</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1"
                />
              </div>
            </div>

            <div className="relative w-full overflow-x-auto">
              {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <i className="ri-loader-4-line animate-spin text-3xl"></i>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                </div>
              )}

              <div
                className={`${loading ? "blur-sm pointer-events-none" : ""}`}
              >
                <table className="min-w-full table-auto">
                  <thead
                    className="text-left"
                    style={{ backgroundColor: "#233a68" }}
                  >
                    <tr>
                      <th
                        className="text-white px-3 py-3 font-semibold"
                        style={{ backgroundColor: "#233a68" }}
                      >
                        No
                      </th>

                      {visibleColumns.map((col) => (
                        <th
                          key={col.index}
                          className="text-white px-3 py-3 font-semibold cursor-pointer select-none"
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
                                    sortField === col.field &&
                                    sortDir === "desc"
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
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.map((item, index) => (
                      <tr
                        key={startIdx + index}
                        className="border-b border-gray-200"
                      >
                        <td className="px-3 py-3">{startIdx + index + 1}</td>

                        {visibleColumns.map((col) => {
                          const rawValue = getNestedValue(item, col.field);

                          let value;

                          if (col.render) {
                            value = col.render(rawValue, item);
                          } else if (col.type === "date") {
                            value = formatDate(rawValue);
                          } else {
                            value = rawValue;
                          }

                          return (
                            <td
                              key={col.index}
                              className={`px-3 py-3 break-words whitespace-normal ${
                                col.className || ""
                              }`}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center pt-3 text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {total === 0
                  ? "Showing 0 entries"
                  : `Showing ${showingFrom} to ${showingTo} of ${total} entries`}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => typeof p === "number" && setCurrentPage(p)}
                    disabled={p === "..."}
                    style={{
                      backgroundColor: currentPage === p ? "#233a68" : "white",
                      color: currentPage === p ? "white" : "#233a68",
                    }}
                    className="px-3 py-1 rounded-md border border-gray-400 min-w-[36px]"
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

window.SupplierReusableTable = SupplierReusableTable;