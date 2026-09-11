// urutan bucket bar, dipakai juga oleh tombol filter di bawah chart —
// diletakkan di luar komponen supaya referensinya stabil
const AGING_BUCKET_ORDER = ["0-30 Days", "31-60 Days", "61-90 Days", ">90 Days"];
// value yang dikirim ke API/modal (beda dari label yang tampil di chart)
const AGING_BUCKET_VALUES = ["0-30", "31-60", "61-90", ">90"];

window.AgingAnalysisChart = function AgingAnalysisChart({
    agingAnalysis, showAllLabels, onShowAllChange, startDate, endDate,
    filterType, selectedCompany,
}) {
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedAging, setSelectedAging] = useState("");
    const [barPositions, setBarPositions] = useState([]);

    const openInvoiceModal = (aging) => {
        setSelectedAging(aging);
        setShowInvoiceModal(true);
    };

    // hitung ulang posisi x tombol supaya SELALU sejajar dengan tengah
    // masing-masing bar — dibaca langsung dari internal ApexCharts
    // (w.globals.translateX/gridWidth = offset & lebar area plot yang
    // sesungguhnya), sama seperti di order_fulfillment_chart.jsx
    const recomputeBarPositions = () => {
        const chart = chartInstanceRef.current;
        if (!chart || !chart.w || !chart.w.globals) return;
        const { translateX = 0, gridWidth = 0 } = chart.w.globals;
        const n = AGING_BUCKET_ORDER.length;
        setBarPositions(
            AGING_BUCKET_ORDER.map((_, i) => translateX + ((i + 0.5) / n) * gridWidth)
        );
    };

    const formatShort = (value) => {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
        return value.toLocaleString("id-ID");
    };

    useEffect(() => {
        if (!agingAnalysis.length || !chartElRef.current) return;

        const bucketOrder = AGING_BUCKET_ORDER;
        const dataMap = {};
        agingAnalysis.forEach(item => {
            dataMap[item.aging_bucket] = parseFloat(item.outstanding_balance);
        });
        const seriesData = bucketOrder.map(bucket => dataMap[bucket] || 0);

        const options = {
            chart: {
                type: "bar",
                height: 250,
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            series: [{ name: "Outstanding Balance", data: seriesData }],
            colors: ["#3b82f6"],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: "50%",
                    dataLabels: { position: "top" },
                },
            },
            dataLabels: {
                enabled: showAllLabels,
                offsetY: -20,
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
            // label kategori bawaan ApexCharts disembunyikan — diganti
            // tombol HTML biasa di bawah chart (lihat JSX), supaya bisa
            // diklik & distyle sebagai button (bg-blue-600, teks putih)
            xaxis: {
                categories: bucketOrder,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { show: false },
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
                strokeDashArray: 0,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 20, bottom: 0, left: 10 },
            },
            legend: { show: false },
            tooltip: {
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
            // ApexCharts TIDAK punya opsi JS resmi untuk warna fill kotak
            // background dataLabels (dataLabels.background.foreColor itu
            // sebenarnya warna TEKS, bukan warna kotak) — jadi kotaknya
            // diwarnai lewat CSS injection langsung ke elemen <rect>-nya,
            // sama seperti fix yang sama di sales_trend_chart.jsx
            if (!chartElRef.current.id) {
                chartElRef.current.id = `aging-chart-${Math.random().toString(36).slice(2)}`;
            }
            const dlStyleId = `aging-datalabel-bg-style-${chartElRef.current.id}`;
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

            recomputeBarPositions();
        });

        // ApexCharts redraw ulang (mengubah translateX/gridWidth) saat
        // window di-resize — posisi tombol perlu ikut dihitung ulang
        // supaya tetap sejajar dengan bar
        window.addEventListener('resize', recomputeBarPositions);

        return () => {
            window.removeEventListener('resize', recomputeBarPositions);
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            if (chartElRef.current) {
                const dlStyleTag = document.getElementById(`aging-datalabel-bg-style-${chartElRef.current.id}`);
                if (dlStyleTag) dlStyleTag.remove();
            }
        };
    }, [agingAnalysis]); // showAllLabels sengaja dipisah, lihat effect di bawah

    // update dataLabels tanpa rebuild chart
    useEffect(() => {
        if (!chartInstanceRef.current) return;
        chartInstanceRef.current.updateOptions({
            dataLabels: {
                enabled: showAllLabels,
                offsetY: -20,
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

    if (!agingAnalysis.length) {
        return (
            <div className="flex items-center justify-center min-h-[300px] w-full">
                <p className="text-muted text-sm">Tidak ada transaksi</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                Aging Analysis
            </h2>
            <div className="flex ml-5 mb-0 gap-2">
                <input
                    type="checkbox"
                    checked={showAllLabels}
                    onChange={(e) => onShowAllChange(e.target.checked)}
                />
                <span>Show All Values</span>
            </div>
            <div ref={chartElRef} />
            {/* posisi tiap tombol dihitung dari koordinat plot area
                ApexCharts (lihat recomputeBarPositions) supaya benar-benar
                sejajar dengan tengah bar-nya masing-masing */}
            <div className="relative h-9 mb-2">
                {barPositions.length === AGING_BUCKET_ORDER.length &&
                    AGING_BUCKET_ORDER.map((label, i) => (
                        <button
                            key={label}
                            onClick={() => openInvoiceModal(AGING_BUCKET_VALUES[i])}
                            style={{ left: `${barPositions[i]}px`, transform: 'translateX(-50%)' }}
                            className="absolute top-0 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
                        >
                            {label}
                        </button>
                    ))}
            </div>

            <window.InvoiceDataModal
                show={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                startDate={startDate}
                endDate={endDate}
                filterType={filterType}
                selectedCompany={selectedCompany}
                initialAging={selectedAging}
            />
        </div>
    );
};