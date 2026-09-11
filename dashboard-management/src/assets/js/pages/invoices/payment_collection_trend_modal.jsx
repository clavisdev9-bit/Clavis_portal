window.PaymentCollectionTrendModal = function PaymentCollectionTrendModal({
    show, onClose, startDate, endDate, filterType, selectedCompany, activeSeries,
}) {
    const [paymentCollectionTrend, setPaymentCollectionTrend] = useState([]);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const isSinglePointRef = React.useRef(false);

    const formatShort = (value) => {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
        return value.toLocaleString("id-ID");
    };

    // fetch payment collection trend — hanya saat modal terbuka
    useEffect(() => {
        if (!show) return;

        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        axios.get(`${__API_URL__}/invoices/payment_collection_trend`, { params })
            .then(res => {
                setPaymentCollectionTrend(res.data);
            })
            .catch(console.error);
    }, [show, startDate, endDate, filterType, selectedCompany]);

    // build chart — TIDAK bergantung pada activeSeries, supaya ganti series
    // (klik "see stats" di card lain) tidak memicu rebuild total. Lihat
    // effect terpisah di bawah untuk showSeries/hideSeries.
    useEffect(() => {
        if (!paymentCollectionTrend.length || !chartElRef.current) return;

        const dates = [...new Set(paymentCollectionTrend.map(item => item.write_date))].sort();
        const isSinglePoint = dates.length === 1;
        isSinglePointRef.current = isSinglePoint;

        const categories = dates.map(date => {
            if (filterType === "year") return date;
            if (filterType === "month") return dayjs(date + "-01").format("MMM YYYY");
            return dayjs(date).format("DD MMM YYYY");
        });

        const dataMap = {};
        paymentCollectionTrend.forEach(item => {
            dataMap[item.write_date] = {
                amount_paid: parseFloat(item.amount_paid),
                outstanding_amount: parseFloat(item.outstanding_amount),
            };
        });

        const series = [
            {
                name: "Amount Paid",
                data: dates.map((date) => (dataMap[date] ? dataMap[date].amount_paid : 0)),
            },
            {
                name: "Outstanding Amount",
                data: dates.map((date) => (dataMap[date] ? dataMap[date].outstanding_amount : 0)),
            },
        ];

        const colors = ["#3b82f6", "#eab308"];

        const options = {
            chart: {
                type: isSinglePoint ? "bar" : "line",
                height: 300,
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            series,
            colors,
            stroke: { width: isSinglePoint ? 0 : 3, curve: "straight" },
            markers: isSinglePoint ? { size: 0 } : { size: 0, hover: { size: 5 } },
            plotOptions: isSinglePoint
                ? { bar: { columnWidth: "35%", borderRadius: 4, dataLabels: { position: "top" } } }
                : {},
            dataLabels: {
                enabled: showAllLabels,
                offsetY: isSinglePoint ? -20 : -10,
                style: { fontSize: "11px", fontWeight: 600, colors: ["#fff"] },
                background: {
                    enabled: true,
                    foreColor: "#fff",
                    padding: 6,
                    borderRadius: 4,
                    borderWidth: 0,
                    opacity: 1,
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return "Rp. " + formatShort(value);
                },
            },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { fontSize: "12px", colors: "#64748b" } },
            },
            yaxis: {
                labels: {
                    style: { fontSize: "12px", colors: "#64748b" },
                    formatter: formatShort,
                },
            },
            grid: {
                show: true,
                borderColor: "#e5e7eb",
                strokeDashArray: 3,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 20, bottom: 0, left: 10 },
            },
            legend: {
                show: true,
                position: "top",
                horizontalAlign: "right",
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
        chartInstanceRef.current = new ApexCharts(chartElRef.current, options);
        chartInstanceRef.current.render().then(() => {
            const allSeriesNames = ["Amount Paid", "Outstanding Amount"];
            allSeriesNames.forEach((name) => {
                if (name === activeSeries) {
                    chartInstanceRef.current.showSeries(name);
                } else {
                    chartInstanceRef.current.hideSeries(name);
                }
            });

            // ApexCharts TIDAK punya opsi JS resmi untuk warna fill kotak
            // background dataLabels (dataLabels.background.foreColor itu
            // sebenarnya warna TEKS, bukan warna kotak) — jadi kotaknya
            // diwarnai lewat CSS injection langsung ke elemen <rect>-nya,
            // sama seperti fix yang sama di sales_trend_chart.jsx
            if (!chartElRef.current.id) {
                chartElRef.current.id = `pct-chart-${Math.random().toString(36).slice(2)}`;
            }
            const dlStyleId = `pct-datalabel-bg-style-${chartElRef.current.id}`;
            let dlStyleTag = document.getElementById(dlStyleId);
            if (!dlStyleTag) {
                dlStyleTag = document.createElement("style");
                dlStyleTag.id = dlStyleId;
                document.head.appendChild(dlStyleTag);
            }
            dlStyleTag.innerHTML = `
                #${chartElRef.current.id} .apexcharts-datalabels rect {
                    fill: #3b82f6 !important;
                }
            `;
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            if (chartElRef.current) {
                const dlStyleTag = document.getElementById(`pct-datalabel-bg-style-${chartElRef.current.id}`);
                if (dlStyleTag) dlStyleTag.remove();
            }
        };
    }, [paymentCollectionTrend]);

    // ganti series aktif (klik "see stats" di card lain saat modal masih
    // terbuka) — tanpa rebuild chart
    useEffect(() => {
        if (!chartInstanceRef.current) return;
        const allSeriesNames = ["Amount Paid", "Outstanding Amount"];
        allSeriesNames.forEach((name) => {
            if (name === activeSeries) {
                chartInstanceRef.current.showSeries(name);
            } else {
                chartInstanceRef.current.hideSeries(name);
            }
        });
    }, [activeSeries]);

    // update dataLabels tanpa rebuild chart
    useEffect(() => {
        if (!chartInstanceRef.current) return;
        chartInstanceRef.current.updateOptions({
            dataLabels: {
                enabled: showAllLabels,
                offsetY: isSinglePointRef.current ? -20 : -10,
                style: { fontSize: "11px", fontWeight: 600, colors: ["#fff"] },
                background: {
                    enabled: true,
                    foreColor: "#fff",
                    padding: 6,
                    borderRadius: 4,
                    borderWidth: 0,
                    opacity: 1,
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return "Rp. " + formatShort(value);
                },
            },
        }, false, false);
    }, [showAllLabels]);

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
                        Payment Collection Trend
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="text-slate-700 dark:text-slate-200 relative">
                    <label className="absolute top-0 left-0 z-20 flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showAllLabels}
                            onChange={(e) => setShowAllLabels(e.target.checked)}
                        />
                        <span className="text-sm">Show All Values</span>
                    </label>
                    <div ref={chartElRef} />
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