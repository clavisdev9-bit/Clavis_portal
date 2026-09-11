window.CompanyRevenueChart = function CompanyRevenueChart({ companyRevenue, loading, startDate, endDate }) {
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const colors = ["#8b5cf6", "#60a5fa", "#86efac", "#fbbf24", "#ef4444", "#1f2937"];

    useEffect(() => {
        if (!companyRevenue.length || !chartElRef.current) {
            // kalau tidak ada data, cabang JSX di bawah ("Tidak ada
            // transaksi") tidak me-render <div ref={chartElRef}> sama
            // sekali — containernya betul-betul di-unmount. Instance lama
            // HARUS di-destroy & di-null-kan di sini, kalau tidak dia jadi
            // "yatim" (nunjuk ke DOM node yang sudah dibuang React), dan
            // nanti pas data ada lagi, cabang di bawah keliru mengira
            // instance masih valid lalu updateOptions() ke instance basi
            // itu — bukan bikin instance baru yang nempel ke container
            // yang baru di-mount
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return;
        }

        const categories = companyRevenue.map(item => item.company);
        const seriesData = companyRevenue.map(item => Number(item.percentage));

        const options = {
            series: seriesData,
            chart: {
                height: 200,
                type: "donut",
                zoom: { enabled: false },
                toolbar: { show: false },
            },
            stroke: { show: false },
            labels: categories,
            colors,
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }],
            legend: { show: false }, // legend bawaan dimatikan, diganti tabel custom di bawah
            plotOptions: {
                pie: { donut: { size: "45%" } }
            },
        };

        // PENTING: jangan destroy()+buat instance baru tiap kali data
        // berubah — render() ApexCharts itu async, jadi kalau destroy()
        // dipanggil lagi sebelum render() sebelumnya benar-benar selesai,
        // chart bisa "nyangkut" (geometry lama + label baru tercampur).
        // Kalau instance sudah ada, cukup updateOptions() — ApexCharts
        // sendiri yang jamin update-nya aman/tidak race. Instance baru
        // cuma dibuat sekali, pas pertama kali chart ini muncul.
        if (chartInstanceRef.current) {
            chartInstanceRef.current.updateOptions(options, true, true);
        } else {
            chartInstanceRef.current = new ApexCharts(chartElRef.current, options);
            chartInstanceRef.current.render();
        }
    }, [companyRevenue]);

    // destroy chart HANYA saat komponen benar-benar unmount (bukan tiap
    // kali companyRevenue berubah)
    useEffect(() => {
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    if (!companyRevenue.length) {
        return (
            <window.LoadingOverlay loading={loading}>
                <div className="flex items-center justify-center min-h-[300px] w-full">
                    <p className="text-muted text-sm">Tidak ada transaksi</p>
                </div>
            </window.LoadingOverlay>
        );
    }

    const sortedRevenue = [...companyRevenue].sort(
        (a, b) => Number(b.total_amount) - Number(a.total_amount)
    );

    return (
        <window.LoadingOverlay loading={loading}>
            <div className="flex flex-col">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    All Company Revenue&nbsp;&nbsp;
                    <span className="normal-case font-normal text-muted">
                        ({window.formatDateRangeLabel(startDate, endDate)})
                    </span>
                </h2>

                <div ref={chartElRef} />

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-darkborder text-left text-slate-500 dark:text-slate-400">
                                <th className="py-1 px-2">No</th>
                                <th className="py-1 px-2">Company Name</th>
                                <th className="py-1 px-2 text-right">Amount Total</th>
                                <th className="py-1 px-2 text-right">Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRevenue.map((item, i) => {
                                const amount = Number(item.total_amount);
                                const percentage = Number(item.percentage).toFixed(1);

                                // cari posisi asli di companyRevenue (sebelum sorting),
                                // supaya warna dot tabel cocok dengan warna slice chart
                                const originalIndex = companyRevenue.findIndex(
                                    (c) => c.company === item.company
                                );

                                return (
                                    <tr
                                        key={item.company}
                                        className="border-b border-slate-100 dark:border-slate-700"
                                    >
                                        <td className="py-1 px-2">{i + 1}</td>
                                        <td className="py-1 px-2">
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="w-2 h-2 rounded-full flex-none"
                                                    style={{ backgroundColor: colors[originalIndex % colors.length] }}
                                                />
                                                {item.company}
                                            </span>
                                        </td>
                                        <td className="py-1 px-2 text-right">
                                            {window.formatCurrency(amount)}
                                        </td>
                                        <td className="py-1 px-2 text-right">
                                            {percentage}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </window.LoadingOverlay>
    );
};