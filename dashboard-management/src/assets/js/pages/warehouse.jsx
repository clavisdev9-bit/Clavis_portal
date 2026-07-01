const { useEffect, useState, useRef } = React;

const WarehouseDashboard = () => {
  const tableRef = useRef();
  const [summary, setSummary] = useState(null);
  const [warehouseData, setWarehouseData] = useState([]);
  const columns = [
    { label: "location_code", index: 2, default: true },
    { label: "location_name", index: 3, default: true },
    { label: "location_type", index: 4, default: true },
    { label: "city", index: 5, default: true },
    { label: "province", index: 6, default: true },
    { label: "contact_name", index: 7, default: true },
    { label: "phone", index: 8, default: true },
    { label: "email", index: 9, default: true },
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

  useEffect(() => {
    axios
      .get(`${__JUBELIO_URL__}/api/locations/dashboard`)
      .then((res) => {
        if (!res.data.success) {
          console.error("API returned error:", res.data.message);
          return;
        }
        setSummary(res.data.data.summary);
      })
      .catch((err) => console.error("API Error (dashboard):", err));
  }, []);

  const formatNumber = (val) => {
    if (val === undefined || val === null) return "-";
    return Number(val).toLocaleString("en-US");
  };

  const summaryCards = summary
    ? [
        {
          key: "locations",
          title: "Total Locations",
          icon: "ri-map-pin-2-line",
          iconColor: "text-slate-400",
          type: "number",
          total: formatNumber(summary.total_locations),
          subtitle: "Jumlah seluruh lokasi terdaftar",
        },
        {
          key: "location_status",
          title: "Location Status",
          icon: "ri-toggle-line",
          iconColor: "text-slate-400",
          type: "bubbles",
          bubbles: [
            {
              label: "Active",
              value: formatNumber(summary.active_locations),
              color: "bg-emerald-100 text-emerald-600",
            },
            {
              label: "Inactive",
              value: formatNumber(summary.inactive_locations),
              color: "bg-red-100 text-red-500",
            },
          ],
          subtitle: "Perbandingan lokasi aktif dan nonaktif",
        },
        {
          key: "warehouse_types",
          title: "Warehouse Types",
          icon: "ri-home-4-line",
          iconColor: "text-slate-500",
          type: "bubbles",
          bubbles: [
            {
              label: "Gudang",
              value: formatNumber(summary.warehouse),
              color: "bg-emerald-100 text-emerald-600",
            },
            {
              label: "POS",
              value: formatNumber(summary.pos_outlet),
              color: "bg-blue-100 text-blue-600",
            },
            {
              label: "Multi",
              value: formatNumber(summary.multi_origin),
              color: "bg-amber-100 text-amber-500",
            },
          ],
          subtitle: "Distribusi tipe lokasi",
        },
        {
          key: "sync_status",
          title: "Sync Status",
          icon: "ri-refresh-line",
          iconColor: "text-violet-500",
          type: "bubbles",
          bubbles: [
            {
              label: "Success",
              value: formatNumber(summary.sync_success),
              color: "bg-emerald-100 text-emerald-600",
            },
            {
              label: "Failed",
              value: formatNumber(summary.sync_failed),
              color: "bg-red-100 text-red-500",
            },
          ],
          subtitle: "Status sinkronisasi data lokasi",
        },
      ]
    : [];

  const renderCodeWithStatus = (code, row) => {
    const isActive = !!row.is_active;
    const isWarehouse = !!row.is_warehouse;
    const codeStyle = isActive ? "" : "color:#9ca3af;";
    const activeIcon = isActive
      ? `<i class="ri-checkbox-circle-fill js-tooltip" data-tooltip="Active" style="color:#10b981; margin-left:6px; cursor:default;"></i>`
      : `<i class="ri-close-circle-fill js-tooltip" data-tooltip="Nonaktif" style="color:#9ca3af; margin-left:6px; cursor:default;"></i>`;
    const warehouseIcon = isWarehouse
      ? `<i class="ri-store-2-fill js-tooltip" data-tooltip="Warehouse" style="color:#3b82f6; margin-left:4px; cursor:default;"></i>`
      : "";
    return `<span style="${codeStyle}">${code || "-"}</span>${activeIcon}${warehouseIcon}`;
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
      ["Location Code", data.location_code],
      ["Location Name", data.location_name],
      ["Location Type", data.location_type],
      ["Contact Name", data.contact && data.contact.name],
      ["Phone", data.contact && data.contact.phone],
      ["Email", data.contact && data.contact.email],
      ["Address", data.address && data.address.address],
      ["Area", data.address && data.address.area],
      ["City", data.address && data.address.city],
      ["Province", data.address && data.address.province],
      ["Postal Code", data.address && data.address.post_code],
      ["Active", data.flags && data.flags.is_active ? "Yes" : "No"],
      ["Warehouse", data.flags && data.flags.is_warehouse ? "Yes" : "No"],
      ["POS Outlet", data.flags && data.flags.is_pos_outlet ? "Yes" : "No"],
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
    let tooltipEl = document.getElementById("global-status-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "global-status-tooltip";
      tooltipEl.style.position = "fixed";
      tooltipEl.style.display = "none";
      tooltipEl.style.zIndex = "99999";
      tooltipEl.style.background = "transparent";
      tooltipEl.style.color = "#000000";
      tooltipEl.style.fontSize = "10px";
      tooltipEl.style.lineHeight = "1.2";
      tooltipEl.style.padding = "0";
      tooltipEl.style.whiteSpace = "nowrap";
      tooltipEl.style.pointerEvents = "none";
      document.body.appendChild(tooltipEl);
    }
    const margin = 8;
    const gap = 2;
    const positionTooltip = (target) => {
      const rect = target.getBoundingClientRect();
      tooltipEl.style.display = "block";
      const tooltipRect = tooltipEl.getBoundingClientRect();

      let top = rect.top - tooltipRect.height - gap;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

      if (top < margin) {
        top = rect.bottom + gap;
      }
      if (top + tooltipRect.height > window.innerHeight - margin) {
        top = window.innerHeight - tooltipRect.height - margin;
      }
      if (left < margin) {
        left = margin;
      }
      if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
      }
      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest(".js-tooltip");
      if (!target) return;
      tooltipEl.textContent = target.getAttribute("data-tooltip") || "";
      positionTooltip(target);
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest(".js-tooltip");
      if (!target) return;
      if (target.contains(e.relatedTarget)) return;
      tooltipEl.style.display = "none";
    };

    const handleScrollOrResize = () => {
      tooltipEl.style.display = "none";
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  useEffect(() => {
    const handleDetailClick = (e) => {
      const btn = e.target.closest(".btn-detail");
      if (!btn) return;
      const code = btn.getAttribute("data-code");
      if (!code) return;

      const table = tableRef.current;
      if (!table) return;

      const tr = btn.closest("tr");
      const row = table.row(tr);
      const colspan = table.columns(":visible").count();

      if (row.child.isShown()) {
        row.child.hide();
        $(tr).removeClass("shown");
        return;
      }

      table.rows().every(function () {
        if (this.child.isShown()) this.child.hide();
      });
      $("#warehouseTable tbody tr").removeClass("shown");

      row.child(renderLoadingRowHtml(colspan)).show();
      $(tr).addClass("shown");

      axios
        .get(`${__JUBELIO_URL__}/api/locations/code/${code}`)
        .then((res) => {
          if (res.data && res.data.success) {
            row.child(renderDetailRowHtml(res.data.data, colspan)).show();
          } else {
            row
              .child(renderErrorRowHtml(colspan, res.data && res.data.message))
              .show();
          }
        })
        .catch((err) => {
          console.error("API Error (detail by code):", err);
          row.child(renderErrorRowHtml(colspan, "Koneksi API gagal")).show();
        });
    };

    document.addEventListener("click", handleDetailClick);
    return () => document.removeEventListener("click", handleDetailClick);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = `${__JUBELIO_URL__}/api/locations`;

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
        setWarehouseData(filtered);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, [startDate, endDate]);

  useEffect(() => {
    if (!tableRef.current) {
      tableRef.current = $("#warehouseTable").DataTable({
        data: warehouseData,
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
            data: "location_code",
            title: "Code",
            render: function (data, type, row) {
              if (type === "display") {
                return renderCodeWithStatus(data, row);
              }
              return data;
            },
          },
          { data: "location_name", title: "Name" },
          { data: "location_type", title: "Type" },
          { data: "city", title: "City" },
          { data: "province", title: "Province" },
          { data: "contact_name", title: "Contact Name" },
          { data: "phone", title: "Phone" },
          { data: "email", title: "Email" },
          {
            data: null,
            title: "Actions",
            orderable: false,
            searchable: false,
            className: "sticky-col-right text-center",
            render: function (_data, _type, row) {
              return `
                <button
                  class="btn-detail relative text-slate-600 hover:text-blue-600 text-lg"
                  data-code="${row.location_code}"
                >
                  <i class="ri-eye-line js-tooltip" data-tooltip="Detail"></i>
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
    } else {
      tableRef.current.clear();
      tableRef.current.rows.add(warehouseData);
      tableRef.current.draw();
      tableRef.current.columns.adjust();
    }
  }, [warehouseData]);

  return (
    <div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-5 mt-5 mb-6">
        {summaryCards.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} class="card p-4 animate-pulse">
                <div class="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-3"></div>
                <div class="h-7 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-3"></div>
                <div class="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))
          : summaryCards.map((card) => (
              <div key={card.key} class="card p-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class={`${card.icon} text-lg ${card.iconColor}`}></i>
                  <p class="text-sm font-medium text-slate-500 dark:text-gray-300">
                    {card.title}
                  </p>
                </div>

                {card.type === "number" ? (
                  <h3 class="text-2xl font-bold mb-2">{card.total}</h3>
                ) : (
                  <div class="flex flex-wrap gap-2 mb-2">
                    {card.bubbles.map((bubble) => (
                      <span
                        key={bubble.label}
                        class={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${bubble.color}`}
                      >
                        {bubble.value} {bubble.label}
                      </span>
                    ))}
                  </div>
                )}
                <p class="text-sm text-slate-400">{card.subtitle}</p>
              </div>
            ))}
      </div>
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
              <h4 class="font-semibold pt-1">Warehouse Report</h4>
              <div class="flex justify-end gap-1" ref={filterRef}>
                <div className="relative">
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
                <table id="warehouseTable" className="min-w-full table-auto">
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
const root = ReactDOM.createRoot(document.getElementById("warehouse"));
root.render(<WarehouseDashboard />);
