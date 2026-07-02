const { useEffect, useState, useRef } = React;

const Supplier = () => {
  const tableRef = useRef();
  const [supplierData, setSupplierData] = useState([]);
  const columns = [
    { label: "contact_name", index: 2, default: true },
    { label: "contact_full", index: 3, default: true },
    { label: "category_display", index: 4, default: true },
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
      ["Contact Name", data.contact_name],
      ["Contact Full", data.contact_full],
      ["Category", data.category_display],
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

  useEffect(() => {
    setLoading(true);
    const url = `${__JUBELIO_URL__}/api/master-supplier`;

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
        setSupplierData(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, [startDate, endDate]);

  useEffect(() => {
    if (!tableRef.current) {
      tableRef.current = $("#supplierTable").DataTable({
        data: supplierData,
        columns: [
          {
            data: null,
            title: "No",
            orderable: false,
            searchable: false,
            className: "sticky-col-left text-center",
            width: "30px",
            createdCell: function (td) {
              $(td).addClass("sticky-col-left");
            },
            render: function (_data, _type, _row, meta) {
              return meta.row + 1;
            },
          },
          {
            data: "contact_name",
            title: "Contact Name",
            render: (value, type, item) => {
              const isActive =
                item.status === "active" ||
                item.status === 1 ||
                item.status === true;

              const badgeClass = isActive
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300";

              return `
                <div class="flex items-center justify-between w-full gap-2">
                    <span>${value || "-"}</span>
                    <span class="px-2 py-0.5 text-xs rounded-full border ${badgeClass}">
                    ${isActive ? "Active" : "Inactive"}
                    </span>
                </div>
                `;
            },
          },
          { data: "contact_full", title: "Contact Full" },
          { data: "category_display", title: "Category" },
        ],
        columnDefs: [
          ...columns.map((col, i) => ({
            targets: i + 1,
            visible: col.default,
          })),
        ],
        autoWidth: false,
        scrollX: true,
      });
    } else {
      tableRef.current.clear();
      tableRef.current.rows.add(supplierData);
      tableRef.current.draw();
      tableRef.current.columns.adjust();
    }
  }, [supplierData]);

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
              <h4 class="font-semibold pt-1">Supplier Report</h4>
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
                <table id="supplierTable" className="min-w-full table-auto">
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
const root = ReactDOM.createRoot(document.getElementById("supplier"));
root.render(<Supplier />);
