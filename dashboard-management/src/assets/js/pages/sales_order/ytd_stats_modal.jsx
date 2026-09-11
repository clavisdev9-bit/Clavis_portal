window.YtdStatsModal = function YtdStatsModal({ show, onClose, selectedCompany, endpoint = "/sales/stats_ytd" }) {
    const [statsYtd, setStatsYtd] = useState([]);
    const [isLoadingYtd, setIsLoadingYtd] = useState(false);
    const [showAllLabelsYtd, setShowAllLabelsYtd] = useState(false);
    const [selectedYearIndex, setSelectedYearIndex] = useState(null);
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const checkboxRef = React.useRef(null);

    // fetch stats ytd
    useEffect(() => {
        const params = {};
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoadingYtd(true);
        axios.get(`${__API_URL__}${endpoint}`, { params })
            .then(res => {
                setStatsYtd(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingYtd(false));
    }, [selectedCompany, endpoint]);

    // render chart — hanya jalan kalau elemen target sudah ter-mount
    // (yaitu saat modal sedang terbuka, karena chartElRef cuma ke-attach
    // ketika <div ref={chartElRef} /> ada di DOM)
    useEffect(() => {
        if (!statsYtd.length || !chartElRef.current) return;
        const targetEl = chartElRef.current;
        setSelectedYearIndex(null); // reset seleksi tiap kali chart dibangun ulang

        const monthOrder = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        const parsed = statsYtd.map(item => {
            const [monthName, year] = item.bulan.split(" ");
            return {
                monthName,
                year,
                total: parseFloat(item.total),
            };
        });

        const years = [...new Set(parsed.map(item => item.year))].sort();
        const monthsInData = [...new Set(parsed.map(item => item.monthName))];
        const categories = monthOrder.filter(m => monthsInData.includes(m));

        const dataMap = {};
        parsed.forEach(item => {
            dataMap[`${item.year}-${item.monthName}`] = item.total;
        });

        const colors = ["#eab308", "#3b82f6"];
        const seriesData = years.map((year, idx) => {
            // kalau total suatu bulan 0 (atau tidak ada datanya), samakan
            // dengan nilai bulan sebelumnya (carry forward) — supaya
            // garis tidak turun drastis ke 0 cuma karena bulan itu belum
            // ada transaksi tercatat
            let lastValue = 0;
            const data = categories.map(month => {
                const rawValue = dataMap[`${year}-${month}`];
                if (rawValue !== undefined && rawValue !== 0) {
                    lastValue = rawValue;
                }
                return lastValue;
            });
            return {
                name: year,
                color: colors[idx % colors.length],
                data,
            };
        });

        // ============================================
        // INJECT CSS untuk paksa warna legend marker
        // ============================================
        if (!targetEl.id) {
            targetEl.id = `chart7-${selectedCompany || 'all'}`;
        }
        const styleId = `legend-style-ytd-${selectedCompany || 'all'}`;
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `
            #${targetEl.id} .apexcharts-legend-series:nth-child(1) .apexcharts-legend-marker {
                background: ${colors[0]} !important;
                opacity: 1 !important;
                border-radius: 50% !important;
                border: none !important;
            }
            #${targetEl.id} .apexcharts-legend-series:nth-child(2) .apexcharts-legend-marker {
                background: ${colors[1]} !important;
                opacity: 1 !important;
                border-radius: 50% !important;
                border: none !important;
            }
            #${targetEl.id} .apexcharts-legend-series {
                margin-right: 16px !important;
                cursor: pointer !important;
            }
        `;

        const options = {
            chart: {
                type: "line",
                height: 350,
                toolbar: { show: false },
                zoom: { enabled: false },
                events: {
                    // klik legend -> pilih/batalkan seri itu (bukan
                    // toggle default ApexCharts, sudah dimatikan lewat
                    // legend.onItemClick.toggleDataSeries di bawah)
                    legendClick: function (chartContext, seriesIndex) {
                        setSelectedYearIndex(prev => prev === seriesIndex ? null : seriesIndex);
                    },
                },
            },
            series: seriesData,
            colors: colors,
            stroke: { width: 3, curve: "straight" },
            markers: {
                size: 4,
                strokeWidth: 2,
                strokeColors: "#fff",
                hover: { size: 6 },
            },
            dataLabels: {
                enabled: showAllLabelsYtd,
                offsetY: -10,
                style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: ["#334155"],
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return window.formatCurrency(value);
                },
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { fontSize: "12px", colors: "#64748b" } },
            },
            yaxis: {
                labels: {
                    style: { fontSize: "12px", colors: "#64748b" },
                    formatter: window.formatCurrency,
                },
            },
            grid: {
                show: true,
                borderColor: "#e5e7eb",
                strokeDashArray: 3,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 30, right: 20, bottom: 0, left: 10 },
            },
            legend: {
                show: true,
                position: "top",
                horizontalAlign: "right",
                markers: {
                    width: 12,
                    height: 12,
                    radius: 3,
                },
                onItemClick: {
                    // matikan perilaku default ApexCharts (hide/show
                    // series) — kita atur sendiri via opacity, bukan
                    // disembunyikan total
                    toggleDataSeries: false,
                },
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (value) {
                        return window.formatCurrency(value);
                    },
                },
            },
        };

        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        chartInstanceRef.current = new ApexCharts(targetEl, options);
        chartInstanceRef.current.render();

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            const oldStyleTag = document.getElementById(styleId);
            if (oldStyleTag) {
                oldStyleTag.remove();
            }
        };
    }, [statsYtd, selectedCompany, show]); // showAllLabelsYtd sengaja dipisah, lihat effect di bawah

    // update dataLabels DAN opacity legend/series dalam SATU effect —
    // supaya tidak race. Opacity diterapkan SETELAH updateOptions() benar-
    // benar selesai (lewat .then()/setTimeout fallback), karena kalau
    // dipisah (2 effect independen), updateOptions() bisa bikin ApexCharts
    // me-render ulang elemen legend/series dan menimpa balik opacity yang
    // sudah di-set sebelumnya — persis bug yang sudah kita perbaiki di
    // sales_trend_chart.jsx.
    useEffect(() => {
        if (!chartInstanceRef.current) return;

        const applyOpacity = () => {
            if (!chartElRef.current) return;

            const seriesElements = chartElRef.current.querySelectorAll(".apexcharts-series");
            seriesElements.forEach((el, i) => {
                el.style.transition = "opacity 300ms ease";
                el.style.opacity = (selectedYearIndex === null || i === selectedYearIndex) ? "1" : "0.3";
            });

            const legendElements = chartElRef.current.querySelectorAll(".apexcharts-legend-series");
            legendElements.forEach((el, i) => {
                el.style.transition = "opacity 300ms ease";
                el.style.opacity = (selectedYearIndex === null || i === selectedYearIndex) ? "1" : "0.3";
            });
        };

        const result = chartInstanceRef.current.updateOptions({
            dataLabels: {
                enabled: showAllLabelsYtd,
                enabledOnSeries: selectedYearIndex === null ? undefined : [selectedYearIndex],
            },
        }, false, true, false);

        if (result && typeof result.then === "function") {
            result.then(applyOpacity);
        } else {
            setTimeout(applyOpacity, 100);
        }
    }, [showAllLabelsYtd, selectedYearIndex]);

    // klik di mana pun KECUALI legend chart & checkbox "Show All Values"
    // -> reset seleksi, semua garis muncul lagi. Legend-nya dirender
    // ApexCharts sendiri (class bawaan .apexcharts-legend), jadi dideteksi
    // lewat class itu — bukan ref biasa seperti di CustomerLegend/MTD
    // yang legend-nya custom React.
    useEffect(() => {
        if (!show) return;
        const handleClickOutside = (event) => {
            const legendEl = chartElRef.current && chartElRef.current.querySelector(".apexcharts-legend");
            const insideLegend = legendEl && legendEl.contains(event.target);
            const insideCheckbox = checkboxRef.current && checkboxRef.current.contains(event.target);
            if (!insideLegend && !insideCheckbox) {
                setSelectedYearIndex(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [show]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-7xl mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        YTD Sales Trend — 2025 vs 2026
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="text-slate-700 dark:text-slate-200">
                    <window.LoadingOverlay loading={isLoadingYtd}>
                        <div className="relative">
                            <div
                                ref={checkboxRef}
                                className="absolute top-0 left-0 z-10 flex items-center gap-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={showAllLabelsYtd}
                                    onChange={(e) => setShowAllLabelsYtd(e.target.checked)}
                                />
                                <span className="text-sm">Show All Values</span>
                            </div>
                            <div ref={chartElRef} />
                        </div>
                    </window.LoadingOverlay>
                </div>

                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};