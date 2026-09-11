window.SalesTrendChart = function SalesTrendChart({
    companyId, salesStats, filterType, selectedFilterBy,
    showAllLabels, visibleCustomers, customers, customerColors,
    selectedDatasets, companyListEndpoint = "/sales/company_list",
    height = 280,
}) {
    const chartElRef = React.useRef(null);
    const chartInstanceRef = React.useRef(null);
    const companyListCache = React.useRef({});
    const datesRef = React.useRef([]);
    const [companyListTotals, setCompanyListTotals] = useState({});

    // ApexCharts otomatis menambah min-height container melebihi angka ini
    // (biasanya karena label sumbu-X yang di-rotate butuh ruang ekstra) —
    // dipaksa balik ke nilai ini setiap kali chart selesai render/update.
    const CHART_HEIGHT = height;

    // =========================================================
    // Saat selectedFilterBy === 'company' (mode "Date"), dataLabels
    // harus menampilkan SUM dari breakdown company_list — sama seperti
    // yang muncul di tooltip — bukan hanya nilai agregat series.
    // Karena "Show All Values" menampilkan label di SEMUA titik sekaligus
    // (bukan cuma yang di-hover), breakdown untuk tiap tanggal harus
    // di-fetch lebih dulu (proaktif), tidak bisa lagi lazy-on-hover saja.
    // =========================================================
    useEffect(() => {
        if (selectedFilterBy !== 'company' || !salesStats.length) {
            setCompanyListTotals({});
            return;
        }

        const dates = [...new Set(salesStats.map(item => item.write_date))].sort();
        let cancelled = false;

        Promise.all(dates.map(rawDate => {
            const params = { filter_type: filterType, date: rawDate };
            return axios.get(`${__API_URL__}${companyListEndpoint}`, { params })
                .then(res => ({ rawDate, data: res.data || [] }))
                .catch(error => {
                    console.error("get_company_list error:", error);
                    return { rawDate, data: [] };
                });
        })).then(results => {
            if (cancelled) return;

            const totals = {};
            const cacheUpdates = {};

            results.forEach(({ rawDate, data }) => {
                let sum = 0;
                let rows = "";
                data.forEach(item => {
                    const value = Number(item.total_amount);
                    if (!Number.isFinite(value) || value <= 0) return;
                    sum += value;
                    rows += `
                        <div class="row">
                            <span class="dot" style="background:${item.color || "#3b82f6"}"></span>
                            <span class="name">${item.company_name}</span>
                            <span class="value">${window.formatCurrency(value)}</span>
                        </div>
                    `;
                });
                totals[rawDate] = sum;
                // sekalian isi cache tooltip, biar hover tidak fetch ulang
                cacheUpdates[rawDate] = rows || `<div class="row">Tidak ada data</div>`;
            });

            companyListCache.current = { ...companyListCache.current, ...cacheUpdates };
            setCompanyListTotals(totals);
        });

        return () => { cancelled = true; };
    }, [selectedFilterBy, salesStats, filterType, companyListEndpoint]);

    useEffect(() => {
        if (!salesStats.length || !chartElRef.current) return;
        companyListCache.current = { ...companyListCache.current }; // jangan buang hasil prefetch di atas

        const dates = [...new Set(salesStats.map(item => item.write_date))].sort();
        datesRef.current = dates;

        const categories = dates.map(date => {
            if (filterType === "year") return date;
            if (filterType === "month") return dayjs(date + "-01").format("MMM YYYY");
            return dayjs(date).format("DD MMM YYYY");
        });
        const isSinglePoint = dates.length === 1;

        let series;
        if (selectedFilterBy === "company") {
            const companyName = (salesStats[0] && salesStats[0].company) || companyId;
            series = [{
                name: companyName,
                color: customerColors[0],
                data: dates.map(date => {
                    const item = salesStats.find(row => row.write_date === date);
                    return item ? Number(item.total_amount) / 1000000 : 0;
                })
            }];
        } else {
            series = visibleCustomers.map((customer) => {
                const originalIndex = customers.indexOf(customer);
                return {
                    name: customer,
                    color: customerColors[originalIndex % customerColors.length],
                    data: dates.map(date => {
                        const item = salesStats.find(row => row.label === customer && row.write_date === date);
                        return item ? Number(item.total_amount) / 1000000 : 0;
                    })
                };
            });
        }

        // columnWidth "50%" itu porsi untuk SATU GRUP kategori, bukan
        // per-series — kalau cuma ada 1 series, porsi itu jatuh ke 1 bar
        // doang (jadi kelihatan kotak besar). Kalau banyak series, porsi
        // yang sama dibagi rata ke semua series (masing-masing tetap
        // ramping). Jadi lebar bar disesuaikan jumlah series-nya.
        const barColumnWidth = series.length <= 1 ? "15%" : "50%";

        const buildCompanyListTooltip = (rawDate, displayDate) => {
            const cached = companyListCache.current[rawDate];
            const tooltipId = `company-tooltip-${rawDate.replace(/[^a-zA-Z0-9]/g, "")}-${companyId}`;
            if (cached) {
                return `<div class="my-tooltip"><div class="title">${displayDate}</div>${cached}</div>`;
            }
            const params = {};
            if (rawDate && filterType) {
                params.date = rawDate;
                params.filter_type = filterType;
            }
            axios.get(`${__API_URL__}${companyListEndpoint}`, { params }).then(res => {
                const companiesList = res.data || [];
                let rows = "";
                companiesList.forEach((item) => {
                    const value = Number(item.total_amount);
                    if (!Number.isFinite(value) || value <= 0) return;
                    rows += `
                        <div class="row">
                            <span class="dot" style="background:${item.color || "#3b82f6"}"></span>
                            <span class="name">${item.company_name}</span>
                            <span class="value">${window.formatCurrency(value)}</span>
                        </div>
                    `;
                });
                companyListCache.current[rawDate] = rows || `<div class="row">Tidak ada data</div>`;
                const tooltipEl = document.getElementById(tooltipId);
                if (tooltipEl) tooltipEl.innerHTML = companyListCache.current[rawDate];
            }).catch(error => {
                console.error("get_company_list error:", error);
                const tooltipEl = document.getElementById(tooltipId);
                if (tooltipEl) tooltipEl.innerHTML = `<div class="row text-red-500">Gagal memuat data</div>`;
            });
            return `<div class="my-tooltip"><div class="title">${displayDate}</div><div id="${tooltipId}" class="row">Loading...</div></div>`;
        };

        // =========================================================
        // Formatter dataLabels:
        // - mode 'company' (Date): pakai SUM dari companyListTotals
        //   (breakdown company_list), fallback ke agregat lokal
        //   selama fetch belum selesai
        // - mode lain (company_list/customer/dst): tetap dari series
        // =========================================================
        const dataLabelFormatter = (value, opts) => {
            if (selectedFilterBy === 'company') {
                const rawDate = datesRef.current[opts.dataPointIndex];
                const total = companyListTotals[rawDate];
                if (total != null) {
                    return total > 0 ? window.formatCurrency(total) : "";
                }
                if (!Number.isFinite(value) || value <= 0) return "";
                return window.formatCurrency(value * 1_000_000);
            }
            if (!Number.isFinite(value) || value <= 0) return "";
            return window.formatCurrency(value * 1_000_000);
        };

        const options = {
            chart: {
                type: isSinglePoint ? "bar" : "area",
                height: CHART_HEIGHT,
                toolbar: { show: false },
                animations: { enabled: true, easing: 'easeinout', speed: 700, animateGradually: { enabled: true, delay: 100 } }
            },
            series,
            xaxis: { categories, labels: { rotate: -45 } },
            yaxis: {
                title: { text: 'Sales (Million)' },
                labels: { formatter: (value) => window.formatCurrency(value * 1_000_000) }
            },
            grid: {
                padding: { top: 0, right: 0, left: 0, bottom: 0 }
            },
            stroke: { width: isSinglePoint ? 0 : 3, curve: 'straight' },
            markers: isSinglePoint
                ? { size: 0 }
                : { size: 4, colors: ["#3b82f6"], strokeColors: "#fff", strokeWidth: 2, hover: { size: 7 } },
            fill: isSinglePoint
                ? { opacity: 1 }
                : { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] } },
            plotOptions: isSinglePoint
                ? { bar: { columnWidth: barColumnWidth, borderRadius: 4, dataLabels: { position: "top" } } }
                : {},
            legend: { show: false },
            tooltip: {
                shared: true,
                intersect: false,
                custom: function ({ series, dataPointIndex, w }) {
                    const rawDate = dates[dataPointIndex];
                    const displayDate = w.globals.categoryLabels[dataPointIndex];
                    if (selectedFilterBy === "company") {
                        return buildCompanyListTooltip(rawDate, displayDate);
                    }
                    let html = `<div class="my-tooltip"><div class="title">${displayDate}</div>`;
                    w.globals.seriesNames.forEach((name, i) => {
                        const value = Number(series[i][dataPointIndex]);
                        if (!Number.isFinite(value) || value <= 0) return;
                        html += `
                            <div class="row">
                                <span class="dot" style="background:${w.globals.colors[i]}"></span>
                                <span class="name">${name}</span>
                                <span class="value">${window.formatCurrency(value * 1_000_000)}</span>
                            </div>
                        `;
                    });
                    html += `</div>`;
                    return html;
                }
            },
            states: {
                normal: { filter: { type: 'none' } },
                hover: { filter: { type: 'light', value: 0.6 } },
                active: { allowMultipleDataPointsSelection: false, filter: { type: 'none' } }
            },
            dataLabels: {
                enabled: showAllLabels,
                offsetY: -10,
                style: { colors: ["#fff"] },
                background: {
                    enabled: true,
                    foreColor: "#fff",
                    padding: 6,
                    borderRadius: 4,
                    borderWidth: 0,
                    opacity: 1,
                },
                formatter: dataLabelFormatter
            }
        };

        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        chartInstanceRef.current = new ApexCharts(chartElRef.current, options);
        chartInstanceRef.current.render().then(() => {
            // paksa min-height sesuai CHART_HEIGHT — ApexCharts sering
            // menambah beberapa px ekstra otomatis (lihat komentar di atas)
            if (chartElRef.current) {
                chartElRef.current.style.minHeight = `${CHART_HEIGHT}px`;
            }

            // ApexCharts TIDAK punya opsi JS resmi untuk warna fill kotak
            // background dataLabels (dataLabels.background.foreColor itu
            // sebenarnya warna TEKS, bukan warna kotak) — jadi kotaknya
            // diwarnai lewat CSS injection langsung ke elemen <rect>-nya.
            if (!chartElRef.current.id) {
                chartElRef.current.id = `sales-trend-chart-${Math.random().toString(36).slice(2)}`;
            }
            const styleId = `datalabel-bg-style-${chartElRef.current.id}`;
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `
                #${chartElRef.current.id} .apexcharts-datalabels rect {
                    fill: #3b82f6 !important;
                }
            `;

            const markers = chartElRef.current.querySelectorAll(".apexcharts-marker");
            if (showAllLabels) {
                markers.forEach(m => { m.style.opacity = "1"; });
                return;
            }
            markers.forEach(m => { m.style.opacity = "0"; });
            setTimeout(() => {
                markers.forEach(m => {
                    m.style.transition = "opacity 300ms";
                    m.style.opacity = "1";
                });
            }, 700);
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            const styleTag = chartElRef.current && document.getElementById(`datalabel-bg-style-${chartElRef.current.id}`);
            if (styleTag) styleTag.remove();
        };
    }, [salesStats, filterType, selectedFilterBy, companyId, height]); // showAllLabels & companyListTotals sengaja dipisah, lihat effect di bawah

    // update dataLabels tanpa rebuild chart — dipicu showAllLabels, saat
    // companyListTotals selesai di-fetch, ATAU saat seleksi highlight dari
    // CustomerLegend berubah (klik item legend). Highlight hanya berlaku
    // untuk mode selain 'company', karena mode 'company' cuma 1 garis.
    useEffect(() => {
        if (!chartInstanceRef.current) return;

        const hasHighlight = selectedFilterBy !== 'company'
            && Array.isArray(selectedDatasets)
            && selectedDatasets.length > 0;

        const seriesIndexes = hasHighlight
            ? selectedDatasets
                .map((label) => visibleCustomers.indexOf(label))
                .filter((i) => i !== -1)
            : undefined;

        // PENTING: opacity DOM harus di-set SETELAH updateOptions selesai
        // redraw, bukan sebelumnya — updateOptions bisa mengganti elemen
        // SVG series, jadi opacity yang ditempel duluan akan tertimpa lagi.
        const applyOpacity = () => {
            if (!chartElRef.current) return;
            // paksa lagi min-height, karena updateOptions bisa memicu
            // ApexCharts menghitung ulang & menimpanya
            chartElRef.current.style.minHeight = `${CHART_HEIGHT}px`;

            const seriesElements = chartElRef.current.querySelectorAll(".apexcharts-series");
            seriesElements.forEach((el, i) => {
                el.style.transition = "opacity 300ms ease";
                el.style.opacity = !hasHighlight || seriesIndexes.includes(i) ? "1" : "0.15";
            });
        };

        const result = chartInstanceRef.current.updateOptions({
            // Saat mode 'company' (Date) dan companyListTotals sudah
            // selesai di-fetch, series HARUS ikut diperbarui pakai total
            // yang sama dengan dataLabels (companyListTotals) — bukan
            // lagi pakai agregat dari salesStats. Kalau tidak, tinggi
            // garis & skala sumbu-Y tetap berdasarkan salesStats (angka
            // beda/lebih kecil), sementara label menampilkan angka dari
            // companyListTotals (lebih besar) — jadi tampak "tidak sesuai".
            ...(selectedFilterBy === 'company' && Object.keys(companyListTotals).length > 0
                ? {
                    series: [{
                        data: datesRef.current.map(date => {
                            const total = companyListTotals[date];
                            return total != null ? total / 1_000_000 : 0;
                        }),
                    }],
                }
                : {}),
            dataLabels: {
                enabled: hasHighlight ? true : showAllLabels,
                offsetY: -10,
                style: { colors: ["#fff"] },
                background: {
                    enabled: true,
                    foreColor: "#fff",
                    padding: 6,
                    borderRadius: 4,
                    borderWidth: 0,
                    opacity: 1,
                },
                enabledOnSeries: seriesIndexes,
                formatter: (value, opts) => {
                    if (selectedFilterBy === 'company') {
                        const rawDate = datesRef.current[opts.dataPointIndex];
                        const total = companyListTotals[rawDate];
                        if (total != null) {
                            return total > 0 ? window.formatCurrency(total) : "";
                        }
                        if (!Number.isFinite(value) || value <= 0) return "";
                        return window.formatCurrency(value * 1_000_000);
                    }
                    if (!Number.isFinite(value) || value <= 0) return "";
                    return window.formatCurrency(value * 1_000_000);
                }
            }
        }, false, true);

        if (result && typeof result.then === "function") {
            result.then(applyOpacity);
        } else {
            setTimeout(applyOpacity, 100);
        }
    }, [showAllLabels, companyListTotals, selectedFilterBy, selectedDatasets, visibleCustomers]);

    return <div ref={chartElRef} />;
};