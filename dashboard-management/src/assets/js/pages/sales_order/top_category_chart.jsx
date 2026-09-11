window.TopCategoryChart = function TopCategoryChart({
    topCategory, startDate, endDate, filterType, selectedCompany,
    productsEndpoint = "/invoices/products",
}) {
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const categoryColors = ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#94a3b8"];
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedCategoryName, setSelectedCategoryName] = useState("");

    const openProductsModal = (categName) => {
        setSelectedCategoryName(categName);
        setShowProductsModal(true);
    };

    useEffect(() => {
        // cek topCategory.length LEBIH DULU, sebelum cek chartElRef.current
        // — saat topCategory kosong, cabang JSX di bawah ("Tidak ada
        // transaksi") tidak me-render <div ref={chartElRef}> sama sekali,
        // jadi React sudah men-set chartElRef.current jadi null SEBELUM
        // effect ini sempat jalan. Kalau urutannya kebalik (cek ref dulu),
        // early-return di situ bikin kode destroy() di bawah ini jadi
        // dead code — instance lama tidak pernah dibersihkan, dan nanti
        // pas data ada lagi, chart baru gagal muncul karena kode masih
        // mengira instance lama valid
        if (!topCategory.length) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return;
        }

        if (!chartElRef.current) return;

        const seriesData = topCategory.map(item => Number(item.total_amount));
        const labels = topCategory.map(item => item.categ_name);
        const totalAmount = topCategory.reduce((sum, item) => sum + Number(item.total_amount), 0);

        const options = {
            chart: {
                type: "donut",
                height: 220,
                offsetX: -20,
                toolbar: { show: false },
            },
            series: seriesData,
            labels,
            colors: categoryColors,
            stroke: { show: false },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val.toFixed(0) + "%";
                },
                style: {
                    fontSize: "13px",
                    fontWeight: 700,
                    colors: ["#fff"],
                },
                dropShadow: { enabled: false },
            },
            legend: { show: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: "40%",
                        labels: {
                            show: true,
                            name: { show: false },
                            value: { show: false },
                            total: {
                                show: true,
                                showAlways: true,
                                label: "TOTAL",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#94a3b8",
                                formatter: function () {
                                    return window.formatCurrency(totalAmount);
                                },
                            },
                        },
                    },
                },
            },
            tooltip: {
                y: {
                    formatter: function (value) {
                        return window.formatCurrency(value);
                    },
                },
            },
        };

        // PENTING: jangan destroy()+buat instance baru tiap kali topCategory
        // berubah — render() ApexCharts itu async, kalau destroy() dipanggil
        // lagi sebelum render() sebelumnya benar-benar selesai, chart bisa
        // "nyangkut" (geometry lama + label baru tercampur). Kalau instance
        // sudah ada, cukup updateOptions() yang memang aman untuk update
        // data berulang.
        if (chartInstanceRef.current) {
            chartInstanceRef.current.updateOptions(options, true, true);
        } else {
            chartInstanceRef.current = new ApexCharts(chartElRef.current, options);
            chartInstanceRef.current.render();
        }
    }, [topCategory]);

    // destroy chart HANYA saat komponen benar-benar unmount (bukan tiap
    // kali topCategory berubah)
    useEffect(() => {
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    if (!topCategory.length) {
        return (
            <div className="flex items-center justify-center min-h-[300px] w-full">
                <p className="text-muted text-sm">Tidak ada transaksi</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                Sales by Category{" "}
                <span className="normal-case font-normal text-muted">
                    ({window.formatDateRangeLabel(startDate, endDate)})
                </span>
            </h2>
            <div className="flex">
                {/* DONUT CHART */}
                <div className="flex-none w-[180px]">
                    <div ref={chartElRef} />
                </div>

                {/* CUSTOM LEGEND */}
                <div className="flex-1 flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-2">
                    {topCategory.map((item, index) => {
                        // persentase bisa negatif (mis. bucket "OTHERS" hasil
                        // penyesuaian/retur) — width CSS tidak boleh negatif,
                        // kalau dipaksa nilainya diabaikan browser dan div-nya
                        // balik ke lebar penuh (100%) bukan kosong. Jadi
                        // di-clamp ke 0 dan warnanya dihilangkan (default,
                        // seperti 0%), bukan malah tampil penuh berwarna.
                        const barWidth = Math.max(0, Number(item.percentage));
                        return (
                        <div key={item.categ_id} className="py-1">
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-2 h-2 rounded-full flex-none"
                                    style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                />
                                <span
                                    className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate cursor-pointer hover:underline"
                                    title={item.categ_name}
                                    onClick={() => openProductsModal(item.categ_name)}
                                >
                                    {item.categ_name}
                                </span>
                                <span
                                    className="text-sm font-medium text-slate-800 dark:text-slate-100 w-12 text-right flex-none cursor-pointer hover:underline"
                                    onClick={() => openProductsModal(item.categ_name)}
                                >
                                    {Number(item.percentage)}%
                                </span>
                                <span
                                    className="text-sm whitespace-nowrap text-slate-500 dark:text-slate-400 w-24 text-right flex-none cursor-pointer hover:underline"
                                    onClick={() => openProductsModal(item.categ_name)}
                                >
                                    {window.formatCurrency(item.total_amount)}
                                </span>
                            </div>
                            <div className="mt-1 h-1.5 bg-slate-100 dark:bg-darkborder rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${barWidth}%`,
                                        backgroundColor: barWidth > 0
                                            ? categoryColors[index % categoryColors.length]
                                            : undefined,
                                    }}
                                />
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>

            <window.BrandProductsModal
                show={showProductsModal}
                onClose={() => setShowProductsModal(false)}
                startDate={startDate}
                endDate={endDate}
                filterType={filterType}
                selectedCompany={selectedCompany}
                categoryName={selectedCategoryName}
                endpoint={productsEndpoint}
            />
        </div>
    );
};