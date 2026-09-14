window.MtdStatsModal = function MtdStatsModal({ show, onClose, selectedCompany, endpoint }) {
    const [statsMtd, setStatsMtd] = useState([]);
    const [isLoadingMtd, setIsLoadingMtd] = useState(false);
    const [showAllLabelsMtd, setShowAllLabelsMtd] = useState(false);
    const [monthLabels, setMonthLabels] = useState([]);
    const [selectedMonthLabel, setSelectedMonthLabel] = useState(null);
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const datesRef = React.useRef([]);
    const isSinglePointRef = React.useRef(false);
    const legendRef = React.useRef(null);
    const dlStyleIdRef = React.useRef(null);

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const formatShort = (value) => {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
        return Number(value).toLocaleString("id-ID");
    };

    // fetch stats mtd — hanya saat modal terbuka
    useEffect(() => {
        if (!show) return;

        const params = {};
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        setIsLoadingMtd(true);
        axios.get(`${__API_URL__}${endpoint}`, { params })
            .then(res => {
                setStatsMtd(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingMtd(false));
    }, [show, selectedCompany, endpoint]);

    // build/update chart
    useEffect(() => {
        if (!statsMtd.length || !chartElRef.current) return;
        setSelectedMonthLabel(null);

        // pisahkan tiap baris jadi { yearMonth, day, monthLabel, total }
        const parsed = statsMtd.map(item => {
            const d = dayjs(item.date);
            return {
                yearMonth: d.format("YYYY-MM"),
                day: d.date(),
                monthLabel: `${monthNames[d.month()]} ${d.year()}`,
                total: parseFloat(item.amount_total),
            };
        });

        // urutkan bulan secara kronologis — yang lebih lama duluan
        // (dianggap "bulan lalu"), yang lebih baru belakangan ("bulan ini")
        const yearMonths = [...new Set(parsed.map(p => p.yearMonth))].sort();
        const maxDay = Math.max(...parsed.map(p => p.day));
        const dates = Array.from({ length: maxDay }, (_, i) => i + 1);
        datesRef.current = dates;
        const isSinglePoint = maxDay === 1;
        isSinglePointRef.current = isSinglePoint;

        const dataMap = {};
        parsed.forEach(p => {
            dataMap[`${p.yearMonth}-${p.day}`] = p.total;
        });

        // abu-abu untuk bulan lalu, biru untuk bulan ini — konsisten dengan YtdStatsModal
        const colors = ["#eab308", "#3b82f6"];
        const seriesData = yearMonths.map((ym, idx) => {
            const sample = parsed.find(p => p.yearMonth === ym);
            // datanya sekarang running total (kumulatif) dari backend —
            // kalau ada tanggal yang tidak muncul di dataMap (tidak ada
            // order baru hari itu), nilainya HARUS tetap sama dengan
            // tanggal sebelumnya (carry forward), BUKAN balik ke 0.
            let lastValue = 0;
            const data = dates.map(day => {
                const key = `${ym}-${day}`;
                if (dataMap[key] !== undefined) {
                    lastValue = dataMap[key];
                }
                return lastValue;
            });
            return {
                name: sample.monthLabel,
                color: colors[idx % colors.length],
                data,
            };
        });

        // legend custom di JSX (bukan andalkan legend bawaan ApexCharts —
        // supaya selalu tampil terlepas dari isu rendering ApexCharts)
        setMonthLabels(seriesData.map((s, idx) => ({ label: s.name, color: colors[idx % colors.length] })));

        const options = {
            chart: {
                type: isSinglePoint ? "bar" : "line",
                height: 350,
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            series: seriesData,
            colors,
            stroke: { width: isSinglePoint ? 0 : 3, curve: "straight" },
            markers: isSinglePoint
                ? { size: 0 }
                : {
                    size: 2,
                    strokeWidth: 1,
                    strokeColors: "#fff",
                    hover: { size: 4 },
                },
            dataLabels: {
                enabled: showAllLabelsMtd,
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
                categories: dates,
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
                // right diperbesar — dataLabel di titik paling kanan (mis.
                // "Rp. 936.8M") melebar ke kanan dari titiknya, kalau
                // padding-nya kurang bisa kepotong tepi chart
                padding: { top: 30, right: 55, bottom: 0, left: 10 },
            },
            plotOptions: isSinglePoint
                ? { bar: { columnWidth: "20%", borderRadius: 4, dataLabels: { position: "top" } } }
                : {},
            legend: { show: false }, // diganti legend custom di JSX (lihat di atas ApexCharts)
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

        // hindari race destroy()/render() — update kalau instance sudah
        // ada, cuma buat baru sekali di awal (lihat pola yang sama di
        // company_revenue_chart.jsx & top_category_chart.jsx)
        if (chartInstanceRef.current) {
            chartInstanceRef.current.updateOptions(options, true, true);
        } else {
            chartInstanceRef.current = new ApexCharts(chartElRef.current, options);
            chartInstanceRef.current.render();
        }

        // ApexCharts TIDAK punya opsi JS resmi untuk warna fill kotak
        // background dataLabels (dataLabels.background.foreColor itu
        // sebenarnya warna TEKS, bukan warna kotak) — jadi kotaknya
        // diwarnai lewat CSS injection langsung ke elemen <rect>-nya,
        // sama seperti fix yang sama di sales_trend_chart.jsx
        if (!chartElRef.current.id) {
            chartElRef.current.id = `mtd-chart-${Math.random().toString(36).slice(2)}`;
        }
        const dlStyleId = `mtd-datalabel-bg-style-${chartElRef.current.id}`;
        dlStyleIdRef.current = dlStyleId;
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
    }, [statsMtd]); // showAllLabelsMtd sengaja dipisah, lihat effect di bawah

    // update dataLabels tanpa rebuild penuh — enabled SELALU ikut checkbox
    // "Show All Values" (klik legend saja tidak memaksa nyala). Tapi kalau
    // ada bulan yang dipilih di legend, dataLabels (waktu checkbox
    // dicentang) cuma tampil untuk series bulan itu (enabledOnSeries),
    // bukan semua bulan.
    useEffect(() => {
        if (!chartInstanceRef.current) return;

        const selectedIndex = selectedMonthLabel
            ? monthLabels.findIndex(m => m.label === selectedMonthLabel)
            : -1;
        const hasSelection = selectedIndex !== -1;

        chartInstanceRef.current.updateOptions({
            dataLabels: {
                enabled: showAllLabelsMtd,
                enabledOnSeries: hasSelection ? [selectedIndex] : undefined,
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
        }, false, true);
    }, [showAllLabelsMtd, selectedMonthLabel, monthLabels]);

    // klik legend -> sembunyikan total garis bulan lain (bukan cuma
    // diredupkan), pakai API resmi ApexCharts hideSeries/showSeries —
    // otomatis juga hilang dari tooltip, tidak cuma soal visual opacity.
    useEffect(() => {
        if (!chartInstanceRef.current) return;
        monthLabels.forEach((m) => {
            if (!selectedMonthLabel || m.label === selectedMonthLabel) {
                chartInstanceRef.current.showSeries(m.label);
            } else {
                chartInstanceRef.current.hideSeries(m.label);
            }
        });
    }, [selectedMonthLabel, monthLabels]);

    // klik di mana pun DI LUAR legend -> reset seleksi, kedua bulan
    // muncul lagi. Pola sama seperti useDatasetHighlight yang dipakai
    // CustomerLegend di chart lain.
    useEffect(() => {
        if (!show) return;
        const handleClickOutside = (event) => {
            const insideLegend = legendRef.current && legendRef.current.contains(event.target);
            if (!insideLegend) {
                setSelectedMonthLabel(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [show]);

    // destroy chart saat modal DITUTUP (bukan cuma saat unmount) — karena
    // `if (!show) return null` melepas elemen <div ref={chartElRef}/> dari
    // DOM setiap kali modal ditutup. Kalau instance lama tidak di-destroy,
    // saat modal dibuka lagi, elemen <div> yang baru sudah beda dari yang
    // dipegang instance lama — tapi kode di atas cuma manggil
    // updateOptions() ke instance lama itu (bukan buat baru), jadi update-
    // nya "nyasar" ke DOM lama yang sudah tidak tampil. Reset ke null di
    // sini memaksa instance BARU dibuat & terikat ke DOM yang baru.
    useEffect(() => {
        if (!show && chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
        if (!show) {
            setSelectedMonthLabel(null);
        }
        if (!show && dlStyleIdRef.current) {
            const dlStyleTag = document.getElementById(dlStyleIdRef.current);
            if (dlStyleTag) dlStyleTag.remove();
            dlStyleIdRef.current = null;
        }
    }, [show]);

    // destroy chart HANYA saat unmount (jaga-jaga tambahan)
    useEffect(() => {
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

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
                        MTD Sales Trend
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="text-slate-700 dark:text-slate-200">
                    <window.LoadingOverlay loading={isLoadingMtd}>
                        <div ref={legendRef} className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showAllLabelsMtd}
                                    onChange={(e) => setShowAllLabelsMtd(e.target.checked)}
                                />
                                <span className="text-sm">Show All Values</span>
                            </label>
                            <div className="flex items-center gap-3">
                                {monthLabels.map((m) => {
                                    const isSelected = selectedMonthLabel === m.label;
                                    const isDimmed = selectedMonthLabel && !isSelected;
                                    return (
                                        <span
                                            key={m.label}
                                            onClick={() => setSelectedMonthLabel(prev => prev === m.label ? null : m.label)}
                                            className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-opacity ${
                                                isDimmed ? "opacity-40" : "opacity-100"
                                            } ${isSelected ? "font-semibold" : ""}`}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-none"
                                                style={{ backgroundColor: m.color }}
                                            />
                                            {m.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div ref={chartElRef} />
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