// urutan kategori bar, dipakai juga oleh tombol filter di bawah chart —
// diletakkan di luar komponen supaya referensinya stabil (tidak perlu ikut
// dependency array useEffect/useCallback)
const ORDER_FULFILLMENT_STATUS_ORDER = ['full', 'partial', 'pending'];

window.OrderFulfillmentChart = function OrderFulfillmentChart({
    deliveryStatus, showAllLabels, onShowAllChange, startDate, endDate,
    filterType, selectedCompany,
}) {
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const totalAmountsRef = React.useRef([]);
    const percentagesRef = React.useRef([]);
    const [showOrderDataModal, setShowOrderDataModal] = useState(false);
    const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState("");
    const [barPositions, setBarPositions] = useState([]);

    const openOrderDataModal = (status) => {
        setSelectedDeliveryStatus(status);
        setShowOrderDataModal(true);
    };

    // hitung ulang posisi x tombol supaya SELALU sejajar dengan tengah
    // masing-masing bar — dibaca langsung dari internal ApexCharts
    // (w.globals.translateX/gridWidth = offset & lebar area plot yang
    // sesungguhnya), bukan dikira-kira lewat CSS grid, karena lebar area
    // label sumbu-Y (mis. "Rp. 600.00 M") ikut menggeser area plot dan
    // besarnya berubah-ubah tergantung nilai data
    const recomputeBarPositions = () => {
        const chart = chartInstanceRef.current;
        if (!chart || !chart.w || !chart.w.globals) return;
        const { translateX = 0, gridWidth = 0 } = chart.w.globals;
        const n = ORDER_FULFILLMENT_STATUS_ORDER.length;
        setBarPositions(
            ORDER_FULFILLMENT_STATUS_ORDER.map((_, i) => translateX + ((i + 0.5) / n) * gridWidth)
        );
    };

    useEffect(() => {
        if (!Array.isArray(deliveryStatus) || !deliveryStatus.length || !chartElRef.current) return;

        const statusOrder = ORDER_FULFILLMENT_STATUS_ORDER;
        const statusColors = {
            full: '#1baf7a',
            partial: '#eda100',
            pending: '#e34948',
        };

        const dataMap = {};
        deliveryStatus.forEach((item) => {
            dataMap[item.delivery_status] = {
                percentage: Number(item.percentage),
                total_amount: Number(item.total_amount),
            };
        });

        const categories = statusOrder.map((s) => s.charAt(0).toUpperCase() + s.slice(1));

        const percentages = statusOrder.map((s) => {
            const entry = dataMap[s];
            const val = entry ? entry.percentage : undefined;
            return (val === undefined || val === null || isNaN(val)) ? 0 : val;
        });

        const totalAmounts = statusOrder.map((s) => {
            const entry = dataMap[s];
            const val = entry ? entry.total_amount : undefined;
            return (val === undefined || val === null || isNaN(val)) ? 0 : val;
        });

        const barColors = statusOrder.map((s) => statusColors[s]);

        // simpan di ref (bukan state) supaya bisa dipakai formatter dataLabels/tooltip
        // tanpa perlu masuk dependency array useEffect
        totalAmountsRef.current = totalAmounts;
        percentagesRef.current = percentages;

        const options = {
            series: [{ name: 'Total', data: totalAmounts }],
            chart: {
                height: 250,
                type: 'bar',
                toolbar: { show: false },
            },
            grid: {
                padding: { top: 30 },
            },
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    distributed: true,
                    borderRadius: 4,
                    dataLabels: { position: 'top' },
                },
            },
            colors: barColors,
            dataLabels: {
                enabled: showAllLabels,
                formatter: function (val) {
                    return window.formatCurrency(val);
                },
                offsetY: -20,
                style: {
                    fontSize: '12px',
                    colors: ['#fff'],
                },
                background: {
                    enabled: true,
                    foreColor: '#fff',
                    padding: 6,
                    borderRadius: 4,
                    borderWidth: 0,
                    opacity: 1,
                },
            },
            legend: { show: false },
            // label kategori bawaan ApexCharts disembunyikan — diganti
            // tombol HTML biasa di bawah chart (lihat JSX), supaya bisa
            // diklik & distyle sebagai button (bg-blue-600, teks putih)
            xaxis: { categories, labels: { show: false } },
            yaxis: {
                labels: {
                    formatter: (val) => window.formatCurrency(val),
                },
            },
            tooltip: {
                y: {
                    formatter: function (val, opts) {
                        const idx = opts.dataPointIndex;
                        const pct = percentagesRef.current[idx];
                        return 'Total: ' + window.formatCurrency(val) + '<br/>Persentase: ' + pct.toFixed(2) + '%';
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
                chartElRef.current.id = `ofc-chart-${Math.random().toString(36).slice(2)}`;
            }
            const dlStyleId = `ofc-datalabel-bg-style-${chartElRef.current.id}`;
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
                const dlStyleTag = document.getElementById(`ofc-datalabel-bg-style-${chartElRef.current.id}`);
                if (dlStyleTag) dlStyleTag.remove();
            }
        };
    }, [deliveryStatus]); // showAllLabels sengaja dipisah, lihat effect di bawah

    // update dataLabels tanpa rebuild chart
    useEffect(() => {
        if (!chartInstanceRef.current) return;
        chartInstanceRef.current.updateOptions(
            {
                dataLabels: {
                    enabled: showAllLabels,
                    offsetY: -20,
                    style: { fontSize: '12px', colors: ['#fff'] },
                    background: {
                        enabled: true,
                        foreColor: '#fff',
                        padding: 6,
                        borderRadius: 4,
                        borderWidth: 0,
                        opacity: 1,
                    },
                },
            },
            false,
            true,
            false
        );
    }, [showAllLabels]);

    return (
        <div>
            {!deliveryStatus.length ? (
                <div className="flex items-center justify-center min-h-[300px] w-full">
                    <p className="text-muted text-sm">Tidak ada transaksi</p>
                </div>
            ) : (
                <>
                    <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100 flex-none">
                        Order Fullfilment{" "}
                        <span className="font-normal text-muted text-sm">
                            ({window.formatDateRangeLabel(startDate, endDate)})
                        </span>
                    </h2>
                    <div className="flex items-center gap-2">
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
                        sejajar dengan tengah bar-nya masing-masing, bukan dikira-
                        kira lewat grid CSS */}
                    <div className="relative h-9 mb-2">
                        {barPositions.length === ORDER_FULFILLMENT_STATUS_ORDER.length &&
                            ORDER_FULFILLMENT_STATUS_ORDER.map((status, i) => (
                                <button
                                    key={status}
                                    onClick={() => openOrderDataModal(status)}
                                    style={{ left: `${barPositions[i]}px`, transform: 'translateX(-50%)' }}
                                    className="absolute top-0 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                    </div>

                    <window.OrderDataModal
                        show={showOrderDataModal}
                        onClose={() => setShowOrderDataModal(false)}
                        startDate={startDate}
                        endDate={endDate}
                        filterType={filterType}
                        selectedCompany={selectedCompany}
                        initialDeliveryStatus={selectedDeliveryStatus}
                    />
                </>
            )}
        </div>
    );
};