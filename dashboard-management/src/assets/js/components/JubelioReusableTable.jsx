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
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState(initialColumns);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const filterRef = useRef(null);
  const channelPopupRef = useRef(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    return path.split(".").reduce((acc, part) => {
      return acc && acc[part];
    }, obj);
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

  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
  });

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
      .finally(() => {
        setLoading(false);
      });
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

  const formatMonth = (dateString) => {
    if (!dateString) return;

    return new Date(dateString).toLocaleDateString("en-GB", {
      month: "long",
    });
  };

  const formatYear = (dateString) => {
    if (!dateString) return;

    return new Date(dateString).toLocaleDateString("en-GB", {
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

    if (rounding === "ceil") {
      number = Math.ceil(number * 100) / 100;
    } else if (rounding === "floor") {
      number = Math.floor(number * 100) / 100;
    } else {
      number = Math.round(number * 100) / 100;
    }

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(number);
  };

  const formatCurrency = (value, currency = "IDR") => {
    if (value == null) return;

    const locale = "id-ID";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
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
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isTrue
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}
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

  const renderChannelPopup = (item) => {
    const channels = item.channels || [];

    if (channels.length === 0) {
      return (
        <div className="absolute right-14 top-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-3 z-[99999] min-w-[250px]">
          <div className="font-semibold text-sm text-gray-700 dark:text-white">
            Tidak ada channel
          </div>
        </div>
      );
    }

    return (
      <div className="absolute right-14 top-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-3 z-[99999] min-w-[280px]">
        <div className="font-semibold text-sm border-b pb-2 mb-2 text-gray-700 dark:text-white">
          Channels ({channels.length})
        </div>

        <div className="flex flex-col gap-2">
          {channels.map((channel, idx) => {
            const storeName = channel.store_name.split(" - ")[0];

            const getIcon = (name) => {
              const lower = name.toLowerCase();
              if (lower.includes("shopee")) return "🛍️";
              if (lower.includes("tokopedia")) return "🟢";
              if (lower.includes("shop")) return "🎵";
              return "🏪";
            };

            return (
              <a
                key={idx}
                href={channel.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span>{getIcon(storeName)}</span>
                  <span className="text-sm text-gray-700 dark:text-white">
                    {storeName}
                  </span>
                </div>

                <i className="ri-external-link-line text-gray-400"></i>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  const defaultRenderExpandedRow = (item) => {
    return (
      <BundlingReusableTable
        item={item}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
      />
    );
  };

  return (
    <div className="dark:bg-dark">
      <div class="card m-5 p-0">
        <div class="border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 font-bold">
          <i class="ri-filter-line"></i> Filter Panel
        </div>
        <div class="grid grid-cols-4 p-4 gap-4">
          <div class="flex flex-col">
            <label class="pb-2 font-medium">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-md dark:bg-dark text-black dark:text-white date-input"
            />
          </div>
          <div class="flex flex-col">
            <label class="pb-2 font-medium">Date To</label>
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
            <div className="grid grid-cols-2 content-between mb-2">
              <h4 className="font-semibold pt-1">{title}</h4>

              <div className="flex justify-end gap-1">
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="w-18 pl-10 pr-4 py-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple focus:outline-none dark:bg-dark"
                  />
                </div>
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowColumn(!showColumn)}
                    id="exportExcel"
                    className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                  >
                    <i className="ri-layout-vertical-line text-md"></i> Columns
                  </button>

                  {showColumn && (
                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-2xl p-4 z-[99999] max-h-[500px] overflow-y-auto inline-block min-w-max whitespace-nowrap">
                      {/* Check All */}
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
                                          ? {
                                              ...item,
                                              visible: !item.visible,
                                            }
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
                      style={{
                        width: col.width || "200px",
                      }}
                    />
                  ))}

                  <col style={{ width: "90px" }} />
                </colgroup>

                <thead
                  className="text-left"
                  style={{
                    backgroundColor: "#0d2b5e",
                  }}
                >
                  <tr>
                    <th className="text-white sticky left-0 bg-black dark:bg-blue-950 z-4">
                      No
                    </th>

                    {visibleColumns.map((col) => (
                      <th key={col.index} className="text-white">
                        {col.label}
                      </th>
                    ))}

                    <th className="text-white sticky right-0 bg-gray-700 dark:bg-blue-950 z-10 min-w-[90px]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tableData.map((item, index) => {
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
                                className={`
                                            px-3 py-2
                                            align-top
                                            break-words
                                            whitespace-normal
                                            overflow-hidden
                                            ${col.className || ""}
                                        `}
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

            {/* Pagination */}
            <div className="pt-3 text-right">
              <button
                onClick={() => fetchData(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-2 rounded-md ${
                  currentPage === 1
                    ? "text-gray-400"
                    : "border border-gray-400 text-black"
                }`}
              >
                <i className="ri-arrow-left-double-line"></i>
              </button>

              {pages.map((p, index) => (
                <button
                  key={index}
                  onClick={() => typeof p === "number" && fetchData(p)}
                  disabled={p === "..."}
                  style={{
                    margin: "0 1px",
                    fontWeight: currentPage === p ? "bold" : "normal",
                    cursor: p === "..." ? "default" : "pointer",
                    backgroundColor: currentPage === p ? "#0d2b5e" : "white",
                    color: currentPage === p ? "white" : "#0d2b5e",
                  }}
                  className="rounded-md px-2 content-center border border-gray-400"
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => fetchData(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-2 rounded-md content-center ${
                  currentPage === totalPages
                    ? "text-gray-400"
                    : "border border-gray-400 text-black"
                }`}
              >
                <i className="ri-arrow-right-double-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.JubelioReusableTable = JubelioReusableTable;
