const { useEffect, useState, useRef } = React;
const { DatePicker,Space } = antd;
const { RangePicker } = DatePicker;

function buildSourceUrl(endpoint, params = {}) {
    const query = new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ).toString();
    return `${__API_URL__}${endpoint}${query ? `?${query}` : ""}`;
}

function SalesInvoicesCard() {
    const [isOpen, setIsOpen] = useState(false);
    const [filterLabel, setFilterLabel] = useState("This Month");
    const dateFilterOptions = [
        { value: "today", label: "Today" },
        { value: "yesterday", label: "Yesterday" },
        { value: "last 7 days", label: "Last 7 Days" },
        { value: "this week", label: "This Week" },
        { value: "this month", label: "This Month" },
        { value: "this year", label: "This Year" },
        { value: "custom", label: "Custom" },
    ];
    const rangePresets = [
        { label: 'Today', value: [dayjs(), dayjs()] },
        { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
        { label: 'Last 14 Days', value: [dayjs().subtract(14, 'day'), dayjs()] },
        { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
        { label: 'last 60 Days', value: [dayjs().subtract(90, 'day'), dayjs()] },
    ];
    const [defaultDates, setDefaultDates] = useState(null);
    const [monthDates, setMonthDates] = useState(null);
    const [yearDates, setYearDates] = useState(null);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const customerColors = [
        '#008FFB',
        '#00E396',
        '#FEB019',
        '#FF4560',
        '#775DD0',
        '#546E7A',
        '#26A69A',
        '#D10CE8',
        '#FF9800',
        '#4CAF50'
    ];
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [companies, setCompanies] = useState([]);
    const [totalOrder, setTotalOrder]=useState("");
    const [activeCustomer, setActiveCustomer]=useState("");
    const [invoicePercentage, setInvoicePercentage]=useState("");
    const [numberOfCustomer, setNumberOfCustomer] = useState([]);
    const [totalDiscount, setTotalDiscount] = useState([]);
    const [discountGiven, setDiscountGiven] = useState([]);
    const contentRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [reportYoy, setReportYoy]=useState([]);
    const [reportMom, setReportMom]=useState([]);
    const [reportMtd, setReportMtd]=useState([]);
    const [reportYtd, setReportYtd]=useState([]);
    const [paymentCollectionTrend, setPaymentCollectionTrend]=useState([]);
    const [activeTrendSeries, setActiveTrendSeries] = useState("Outstanding Amount");
    const [statsYtd, setStatsYtd]=useState([]);
    const [companyResidual, setCompanyResidual]=useState([]);
    const [companyPaid, setCompanyPaid]=useState([]);
    const [salesStats, setSalesStats] = useState([]);
    const [companyRevenue, setCompanyRevenue] = useState([]);
    const [invoiceData, setInvoiceData] = useState([]);
    const invoiceTableRef = useRef({});
    const invoiceDataTableInstance = useRef({});
    const [companySalesStats, setCompanySalesStats] = useState([]);
    const [companyStats, setCompanyStats] = useState([]);
    const [filterType, setFilterType] = useState("date");
    const [selectedFilterBy, setSelectedFilterBy] = useState("company");
    const [showAllLabelsPaymentCollectionTrend, setShowAllLabelsPaymentCollectionTrend] = useState(false);
    const [showAllLabelsYtd, setShowAllLabelsYtd] = useState(false);
    const chartRef8 = useRef({});
    const chartInstance8 = useRef({});
    const chartRef7 = useRef({});
    const chartInstance7 = useRef({});
    const chartRef6 = useRef({});
    const chartInstance6 = useRef({});
    const chartRef5 = useRef({});
    const chartInstance5 = useRef({});
    const chartRef4 = useRef({});
    const chartInstance4 = useRef({});
    const chartRef3Map = useRef({});
    const chartInstance3Map = useRef({});
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    const chartRef = useRef({});
    const chartInstance = useRef({});;
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [hiddenCustomers, setHiddenCustomers] = useState([]);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const [showAllLabels2, setShowAllLabels2] = useState(false);
    const [searchCustomer, setSearchCustomer] = useState("");
    const [topCustomers, setTopCustomers] = useState([]);
    const [showAllCustomers, setShowAllCustomers] = useState(false);
    const [agingAnalysis, setAgingAnalysis]=useState([]);
    const [topCategory, setTopCategory] = useState([]);
    const chartRefCategory = useRef({});
    const chartInstanceCategory = useRef({});
    const categoryColors = ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#94a3b8"];
    const [topProducts, setTopProducts] = useState([]);
    const [topBrands, setTopBrands] = useState([]);
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showStatsOutstandingModal, setShowStatsOutstandingModal] = useState(false);
    const [showInvoiceDataModal, setShowInvoiceDataModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    useEffect(() => {
        setDefaultDates([dayjs().startOf('month'), dayjs()]);
    }, []);
    const onRangeChange = (dates, dateStrings) => {
        if (dates) {
            setDefaultDates(dates);
            setMonthDates(null);
            setYearDates(null);
            setStartDate(dateStrings[0]);
            setEndDate(dateStrings[1]);
            setFilterType("date");
            setFilterLabel(
                `${dayjs(dateStrings[0]).format("DD MMM YYYY")} - ${dayjs(dateStrings[1]).format("DD MMM YYYY")}`
            );
        } else {
            setDefaultDates([dayjs(), dayjs()]);
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setFilterLabel("Today");
        }
    };
    const onMonthRangeChange = (date, dateString) => {
        if (date) {
            setDefaultDates(null);
            setMonthDates(date);
            setYearDates(null);
            setStartDate(dateString[0]); // contoh: 2026-07
            setEndDate(dateString[1]);   // contoh: 2026-08
            setFilterType("month");
            setFilterLabel(
                `${dayjs(dateString[0] + "-01").format("MMM YYYY")} - ${dayjs(dateString[1] + "-01").format("MMM YYYY")}`
            );
        } else {
            setDefaultDates([dayjs(), dayjs()]);
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setFilterLabel("Today");
        }
    };
    const onYearRangeChange = (date, dateString) => {
        if (date) {
            setDefaultDates(null);
            setMonthDates(null);
            setYearDates(date);
            setStartDate(dateString[0]);
            setEndDate(dateString[1]);
            setFilterType("year");
            setFilterLabel(`${dateString[0]} - ${dateString[1]}`);
        } else {
            setDefaultDates([dayjs(), dayjs()]);
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setFilterLabel("Today");
        }
    };
    const [selectedRadio, setSelectedRadio] = useState("this month");
    const handleRadioChange = (value) => {
        if (value === "today") {
            setIsOpen(false);
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs(), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(
                `${dayjs().format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`
            );
        } else if (value === "yesterday") {
            setIsOpen(false);
            setStartDate(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
            setEndDate(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
            setDefaultDates([dayjs().subtract(1, "day"), dayjs().subtract(1, "day")]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(
                `${dayjs().subtract(1, "day").format("DD MMM YYYY")} - ${dayjs().subtract(1, "day").format("DD MMM YYYY")}`
            );
        } else if (value === "last 7 days") {
            setIsOpen(false);
            setStartDate(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs().subtract(7, "day"), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(
                `${dayjs().subtract(7, "day").format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`
            );
        } else if (value === "this week") {
            setIsOpen(false);
            setStartDate(dayjs().startOf('isoWeek').format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs().startOf('isoWeek'), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(
                `${dayjs().startOf('isoWeek').format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`
            );
        } else if (value === "this month") {
            setIsOpen(false);
            setStartDate(dayjs().startOf('month').format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs().startOf('month'), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(
                `${dayjs().startOf('month').format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`
            );
        } else if (value === "this year") {
            setIsOpen(false);
            setStartDate(dayjs().startOf('year').format("YYYY-MM"));
            setEndDate(dayjs().format("YYYY-MM"));
            setMonthDates([dayjs().startOf('year'), dayjs()]);
            setDefaultDates(null);
            setYearDates(null);
            setFilterType("month");
            setFilterLabel(
                `${dayjs().startOf('year').format("MMM YYYY")} - ${dayjs().format("MMM YYYY")}`
            );
        } else if (value === "custom") {
            setIsOpen(true);
        }
    };
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        // Tambahkan company_id
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        // Tambahkan filter
        params.filter_by = selectedFilterBy;
        axios.get(`${__API_URL__}/invoices/total_orders_by_company`, {
            params
        })
        .then(res => {
            setTotalOrder(res.data[0].total_order);
        })
        .catch(console.error)
        .finally(() => {
            
        });

    }, [startDate, endDate, filterType, selectedCompany]);
    // useEffect(() => {
    //     const params = {};
    //     if (startDate && endDate && filterType) {
    //         params.start_date = startDate;
    //         params.end_date = endDate;
    //         params.filter_type = filterType;
    //     }
    //     // Tambahkan company_id
    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }

    //     // Tambahkan filter
    //     params.filter_by = selectedFilterBy;
    //     axios.get(`${__API_URL__}/invoice/active_customer`, {
    //         params
    //     })
    //     .then(res => {
    //         setActiveCustomer(res.data[0]);
    //     })
    //     .catch(console.error)
    //     .finally(() => {
            
    //     });

    // }, [startDate, endDate, filterType, selectedCompany]);
    // useEffect(() => {
    //     const params = {};
    //     if (startDate && endDate && filterType) {
    //         params.start_date = startDate;
    //         params.end_date = endDate;
    //         params.filter_type = filterType;
    //     }
    //     // Tambahkan company_id
    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }

    //     // Tambahkan filter
    //     params.filter_by = selectedFilterBy;
    //     axios.get(`${__API_URL__}/sales/invoice_progress`, {
    //         params
    //     })
    //     .then(res => {
    //         console.log(res.data);
    //         setInvoicePercentage(res.data[0]);
    //     })
    //     .catch(console.error)
    //     .finally(() => {
            
    //     });

    // }, [startDate, endDate, filterType, selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        axios.get(`${__API_URL__}/invoices/companies`, {
            params
        })
        .then(res => {
            const companyList = res.data.map(item => ({
                id: item.company_id[0],
                name: item.company_id[1]
            }));
            setCompanies(companyList);
            if (companyList.length > 0) {
                setSelectedCompany(prev => {
                    // Kalau company yang aktif masih tersedia,
                    // pertahankan company tersebut
                    const exists = companyList.some(
                        company => company.id === prev
                    );

                    if (exists) {
                        return prev;
                    }

                    // Kalau belum ada, pilih company pertama
                    return companyList[0].id;
                });

            } else {
                setSelectedCompany("");
            }

        })
        .catch(console.error);

    }, [startDate, endDate]);
    const handleDatasetMouseEnter = (customer) => {
        if (!selectedCompany) return;
        if (!chartInstance.current[selectedCompany]) return;

        const seriesIndex = visibleCustomers.indexOf(customer);

        if (seriesIndex === -1) return;

        const afterUpdate = () => {
            showMarkers();

            const targetEl = chartRef.current[selectedCompany];
            if (!targetEl) return;

            const seriesElements = targetEl.querySelectorAll(".apexcharts-series");

            seriesElements.forEach((element, i) => {
                element.style.opacity = i === seriesIndex ? "1" : "0.15";
                element.style.transition = "opacity 300ms ease";
            });
        };

        const result = chartInstance.current[selectedCompany].updateOptions(
            {
                dataLabels: {
                    enabled: true,
                    enabledOnSeries: [seriesIndex],
                    formatter(value) {
                        if (value <= 0) return "";
                        return value.toFixed(2) + " M";
                    }
                }
            },
            false,
            false
        );

        if (result && typeof result.then === "function") {
            result.then(afterUpdate);
        } else {
            setTimeout(afterUpdate, 100);
        }
    };
    const showMarkers = () => {
        if (!selectedCompany) return;

        const targetEl = chartRef.current[selectedCompany];
        if (!targetEl) return;

        const markers = targetEl.querySelectorAll('.apexcharts-marker');
        markers.forEach((marker) => {
            marker.style.opacity = '1';
        });
    };
    const handleCompanyClick = (companyId) => {

        const index = companies.findIndex(
            company => company.id === companyId
        );

        if (index === -1) {
            return;
        }

        // Jangan request ulang kalau company sama
        setSelectedCompany(prev => {
            if (prev === companyId) {
                return prev;
            }

            return companyId;
        });

        if (contentRef.current) {
            contentRef.current.scrollTo({
                left: index * contentRef.current.clientWidth,
                behavior: "smooth"
            });
        }
    };
    const handleContentScroll = (e) => {

        const container = e.currentTarget;

        // Hapus timer sebelumnya
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Tunggu sampai scroll berhenti
        scrollTimeoutRef.current = setTimeout(() => {

            const index = Math.round(
                container.scrollLeft / container.clientWidth
            );

            const company = companies[index];

            if (!company) {
                return;
            }

            setSelectedCompany(prev => {

                if (prev === company.id) {
                    return prev;
                }

                return company.id;
            });

        }, 150);
    };
    // useEffect(() => {
    //     const params = {};

    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }

    //     axios.get(`${__API_URL__}/sales/report_yoy`, {
    //         params,
    //     })
    //     .then(res => {
    //         setReportYoy(res.data);
    //     })
    //     .catch(error => {
    //         console.error(error);
    //     });
    // }, [selectedCompany]);
    // useEffect(() => {
    //     const params = {};

    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }

    //     axios.get(`${__API_URL__}/sales/report_mom`, {
    //         params,
    //     })
    //     .then(res => {
    //         setReportMom(res.data);
    //     })
    //     .catch(error => {
    //         console.error(error);
    //     });
    // }, [selectedCompany]);
    useEffect(() => {
        const params = {};

        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        axios.get(`${__API_URL__}/invoices/report_mtd`, {
            params,
        })
        .then(res => {
            setReportMtd(res.data);
        })
        .catch(error => {
            console.error(error);
        });
    }, [selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        axios.get(`${__API_URL__}/invoices/payment_collection_trend`, {
            params,
        })
        .then(res => {
            setPaymentCollectionTrend(res.data);
        })
        .catch(error => {
            console.error(error);
        });
    }, [startDate,endDate,selectedCompany]);
    useEffect(() => {
        const params = {};

        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        axios.get(`${__API_URL__}/invoices/report_ytd`, {
            params,
        })
        .then(res => {
            setReportYtd(res.data);
        })
        .catch(error => {
            console.error(error);
        });
    }, [selectedCompany]);
    useEffect(() => {
        const params = {};

        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        axios.get(`${__API_URL__}/invoices/stats_ytd`, {
            params,
        })
        .then(res => {
            setStatsYtd(res.data);
        })
        .catch(error => {
            console.error(error);
        });
    }, [selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        axios.get(`${__API_URL__}/invoices/company_residual`, {
            params,
        })
        .then(res => {
            setCompanyResidual(res.data[0]);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany
    ]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        axios.get(`${__API_URL__}/invoices/company_paid`, {
            params,
        })
        .then(res => {
            setCompanyPaid(res.data[0]);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany
    ]);
    useEffect(() => {

        const controller = new AbortController();

        const params = {};

        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }

        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        params.filter_by = selectedFilterBy;

        axios.get(`${__API_URL__}/invoices/invoice_stats`, {
            params,
            signal: controller.signal
        })
        .then(res => {
            setSalesStats(res.data);

        })
        .catch(error => {

            if (
                error.name === "CanceledError" ||
                error.code === "ERR_CANCELED"
            ) {
                return;
            }

            console.error(error);

        });

        return () => {
            controller.abort();
        };

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany,
        selectedFilterBy
    ]);
    // EFFECT 1: Buat chart (tidak bergantung pada showAllLabelsYtd)
    // EFFECT 1: Buat chart (tidak bergantung pada showAllLabelsPaymentCollectionTrend)
    useEffect(() => {
        if (!paymentCollectionTrend.length || !selectedCompany) return;
        const targetEl = chartRef8.current[selectedCompany];
        if (!targetEl) return;

        const dates = [...new Set(paymentCollectionTrend.map(item => item.write_date))].sort();

        const categories = dates.map(date => {
            if (filterType === "year") {
                return date;
            }
            if (filterType === "month") {
                return dayjs(date + "-01").format("MMM YYYY");
            }
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

        const formatShort = (value) => {
            if (value >= 1000000000) {
                return (value / 1000000000).toFixed(1) + "B";
            }
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
            }
            if (value >= 1000) {
                return (value / 1000).toFixed(0) + "K";
            }
            return value.toLocaleString("id-ID");
        };

        const colors = ["#3b82f6", "#4c1d95"];

        const options = {
            chart: {
                type: "line",
                height: 300,
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            series: series,
            colors: colors,
            stroke: {
                width: 3,
                curve: "straight",
            },
            markers: {
                size: 0,
                hover: { size: 5 },
            },
            dataLabels: {
                enabled: showAllLabelsPaymentCollectionTrend,
                offsetY: -10,
                style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: ["#334155"],
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return formatShort(value);
                },
            },
            xaxis: {
                categories: categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: { fontSize: "12px", colors: "#64748b" },
                },
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
                horizontalAlign: "left",
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function (value) {
                        return formatCurrency(value);
                    },
                },
            },
            legend: {
                show: true,
                position: "top",
                horizontalAlign: "right",
            },
        };

        if (chartInstance8.current[selectedCompany]) {
            chartInstance8.current[selectedCompany].destroy();
        }

        chartInstance8.current[selectedCompany] = new ApexCharts(targetEl, options);
        chartInstance8.current[selectedCompany].render().then(() => {
            const allSeriesNames = ["Amount Paid", "Outstanding Amount"];

            allSeriesNames.forEach((name) => {
                if (name === activeTrendSeries) {
                    chartInstance8.current[selectedCompany].showSeries(name);
                } else {
                    chartInstance8.current[selectedCompany].hideSeries(name);
                }
            });
        });

        return () => {
            if (chartInstance8.current[selectedCompany]) {
                chartInstance8.current[selectedCompany].destroy();
                delete chartInstance8.current[selectedCompany];
            }
        };
        // showAllLabelsPaymentCollectionTrend sengaja tidak dimasukkan di sini
    }, [paymentCollectionTrend, selectedCompany, showStatsOutstandingModal, activeTrendSeries]);

    // EFFECT 2: Update dataLabels saja saat checkbox berubah, tanpa render ulang chart
    useEffect(() => {
        if (!selectedCompany) return;
        if (!chartInstance8.current[selectedCompany]) return;

        const formatShort = (value) => {
            if (value >= 1000000000) {
                return (value / 1000000000).toFixed(1) + "B";
            }
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
            }
            if (value >= 1000) {
                return (value / 1000).toFixed(0) + "K";
            }
            return value.toLocaleString("id-ID");
        };

        chartInstance8.current[selectedCompany].updateOptions({
            dataLabels: {
                enabled: showAllLabelsPaymentCollectionTrend,
                offsetY: -10,
                style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: ["#334155"],
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return formatShort(value);
                },
            },
        }, false, false);
    }, [showAllLabelsPaymentCollectionTrend, selectedCompany]);
    useEffect(() => {
        if (!statsYtd.length || !selectedCompany) return;
        const targetEl = chartRef7.current[selectedCompany];
        if (!targetEl) return;

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

        const colors = ["#64748b", "#3b82f6"];
        const seriesData = years.map((year, idx) => ({
            name: year,
            color: colors[idx % colors.length],
            data: categories.map(month => dataMap[`${year}-${month}`] || 0),
        }));

        const formatShort = (value) => {
            if (value >= 1000000000) {
                return (value / 1000000000).toFixed(1) + "B";
            }
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
            }
            return value.toLocaleString("id-ID");
        };

        const options = {
            chart: {
                type: "line",
                height: 350,
                toolbar: { show: false },
                zoom: { enabled: false },
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
                    return formatShort(value);
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
                        return formatCurrency(value);
                    },
                },
            },
        };

        if (chartInstance7.current[selectedCompany]) {
            chartInstance7.current[selectedCompany].destroy();
        }

        chartInstance7.current[selectedCompany] = new ApexCharts(targetEl, options);
        chartInstance7.current[selectedCompany].render();

        return () => {
            if (chartInstance7.current[selectedCompany]) {
                chartInstance7.current[selectedCompany].destroy();
                delete chartInstance7.current[selectedCompany];
            }
        };
        // showAllLabelsYtd sengaja tidak dimasukkan di sini
    }, [statsYtd, selectedCompany, showStatsModal]);

    // EFFECT 2: Update dataLabels saja saat checkbox berubah, tanpa render ulang chart
    useEffect(() => {
        if (!selectedCompany) return;
        if (!chartInstance7.current[selectedCompany]) return;

        chartInstance7.current[selectedCompany].updateOptions({
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
                    return formatShort(value);
                },
            },
        }, false, false);
    }, [showAllLabelsYtd, selectedCompany]);
    // useEffect(() => {

    //     const controller = new AbortController();

    //     const params = {};

    //     if (startDate && endDate && filterType) {
    //         params.start_date = startDate;
    //         params.end_date = endDate;
    //         params.filter_type = filterType;
    //     }

    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }

    //     axios.get(`${__API_URL__}/invoice/get_company_sales_stats`, {
    //         params,
    //         signal: controller.signal
    //     })
    //     .then(res => {
    //         setCompanySalesStats(res.data);
    //     })
    //     .catch(error => {

    //         if (
    //             error.name === "CanceledError" ||
    //             error.code === "ERR_CANCELED"
    //         ) {
    //             return;
    //         }

    //         console.error(error);

    //     });

    //     return () => {
    //         controller.abort();
    //     };

    // }, [
    //     startDate,
    //     endDate,
    //     filterType,
    //     selectedCompany
    // ]);
    // useEffect(() => {

    //     const controller = new AbortController();

    //     const params = {};

    //     if (startDate && endDate && filterType) {
    //         params.start_date = startDate;
    //         params.end_date = endDate;
    //         params.filter_type = filterType;
    //     }

    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }

    //     axios.get(`${__API_URL__}/sales/company_stats`, {
    //         params,
    //         signal: controller.signal
    //     })
    //     .then(res => {
    //         setCompanyStats(res.data);

    //     })
    //     .catch(error => {

    //         if (
    //             error.name === "CanceledError" ||
    //             error.code === "ERR_CANCELED"
    //         ) {
    //             return;
    //         }

    //         console.error(error);

    //     });

    //     return () => {
    //         controller.abort();
    //     };

    // }, [
    //     startDate,
    //     endDate,
    //     filterType,
    //     selectedCompany
    // ]);
    
    const isSingleDate = [...new Set(salesStats.map(item => item.write_date))].length === 1;
    const sortedSalesStats = [...salesStats].sort(
        (a, b) => Number(b.total_amount) - Number(a.total_amount)
    );
    const { totalSales } = React.useMemo(() => {

        return {
            totalSales: salesStats.reduce(
                (sum, item) => sum + Number(item.total_amount || 0),
                0
            ),
        };

    }, [salesStats]);
    useEffect(() => {

        if (!chartRef2.current || !salesStats.length) {
            return;
        }

        // hanya tampil jika 1 tanggal
        const dates = [...new Set(salesStats.map(x => x.write_date))];
        const labels = [...new Set(salesStats.map(item => item.label))];
        if (dates.length !== 1) {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
                chartInstance2.current = null;
            }
            return;
        }

        // label customer / product
        const grouped = {};

        sortedSalesStats.forEach(item => {
            if (!grouped[item.company]) {
                grouped[item.company] = [];
            }

            grouped[item.company].push(item);
        });

        const chartData = [];

        Object.entries(grouped).forEach(([company, rows]) => {

            // HEADER COMPANY
            chartData.push({
                x: company,
                y: 0,
                isCompany: true
            });

            // CUSTOMER
            rows.forEach(row => {

                chartData.push({
                    x: "    " + row.label,
                    y: Number(row.total_amount) / 1000000,
                    isCompany: false
                });

            });

        });

        const series = [{
            data: chartData
        }];
        

        const options = {

            chart: {
                type: "bar",
                height: Math.max(400, labels.length * 35),
                toolbar: {
                    show: false
                },
                offsetX: 30
            },

            series,

            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 4,
                    barHeight: "60%",
                    distributed: true
                }
            },

            xaxis: {
                title: {
                    text: "Sales (Million)"
                },
                labels: {
                    formatter(value) {
                        return value.toFixed(0) + " M";
                    }
                }
            },

            dataLabels: {
                enabled: true,

                formatter(value, opts) {

                    const row =
                        opts.w.config.series[0].data[opts.dataPointIndex];

                    if (row.isCompany) {
                        return "";
                    }

                    return value.toFixed(2) + " M";
                }
            },

            legend: {
                show: false
            },

            tooltip: {

                custom({ seriesIndex, dataPointIndex, w }) {

                    const row =
                        w.config.series[0].data[dataPointIndex];

                    if (row.isCompany) {
                        return "";
                    }

                    return `
                        <div class="p-2">
                            <b>${row.x.trim()}</b><br/>
                            ${row.y.toFixed(2)} Million
                        </div>
                    `;
                }

            },

            title: {
                text: "Sales Report",
                align: "left"
            },
            yaxis: {
                labels: {
                    minWidth: 280,
                    maxWidth: 280,
                    align: "left",
                    style: {
                        colors: "blue",
                        fontSize: "13px",
                        fontWeight: 500
                    }
                }
            },
            colors: chartData.map((item, index) => {

                if (item.isCompany) {
                    return "transparent";
                }

                return customerColors[index % customerColors.length];

            }),

        };

        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(
            chartRef2.current,
            options
        );

        chartInstance2.current.render().then(() => {

            const labels = chartRef2.current.querySelectorAll(
                ".apexcharts-yaxis-label"
            );

            labels.forEach((el, index) => {
                const row = chartData[index];

                // ubah anchor menjadi kiri
                el.setAttribute("text-anchor", "start");

                // geser ke kiri
                const x = Number(el.getAttribute("x") || 0);
                if(selectedFilterBy==='customer'){
                    el.setAttribute("x", x - 50);
                }else if(selectedFilterBy==='product'){
                    el.setAttribute("x", x - 50);
                }else{
                    el.setAttribute("x", x - 77);
                }

                if (row.isCompany) {
                    el.classList.add("company-label");
                } else {
                    el.classList.add("customer-label");
                }
            });
            

        });
        return () => {

            if (chartInstance2.current) {
                chartInstance2.current.destroy();
                chartInstance2.current = null;
            }

        };

    }, [salesStats, selectedFilterBy, selectedCompany]);
    
    const companyGroups = React.useMemo(() => {
        const groups = {};

        // Hitung total customer per company
        salesStats.forEach(item => {
            const company = item.company;
            const customer = item.label;
            const amount = Number(item.total_amount);

            if (!groups[company]) {
                groups[company] = {};
            }

            groups[company][customer] =
                (groups[company][customer] || 0) + amount;
        });

        // Ubah menjadi array
        return Object.entries(groups)
            .map(([company, customers]) => ({
                company,
                customers: Object.entries(customers)
                    .sort((a, b) => b[1] - a[1]) // terbesar
                    .map(([customer, total]) => ({
                        customer,
                        total
                    }))
            }))
            .sort((a, b) => {
                // Optional: company dengan total terbesar tampil dulu
                const totalA = a.customers.reduce((s, x) => s + x.total, 0);
                const totalB = b.customers.reduce((s, x) => s + x.total, 0);
                return totalB - totalA;
            });

    }, [salesStats]);
    useEffect(() => {
        const expanded = {};

        companyGroups.forEach(group => {
            expanded[group.company] = true; // default semua terbuka
        });

        setExpandedCompanies(expanded);

    }, [companyGroups]);
    const customers = React.useMemo(() => {
        return companyGroups.flatMap(group =>
            group.customers.map(c => c.customer)
        );
    }, [companyGroups]);
    
    useEffect(() => {
        setHiddenCustomers([]);
    }, [customers]);

    const visibleCustomers = React.useMemo(() => {
        return customers.filter(
            customer => !hiddenCustomers.includes(customer)
        );
    }, [customers, hiddenCustomers]);
    useEffect(() => {
        if (!salesStats.length || !selectedCompany) {
            return;
        }
        const targetEl = chartRef.current[selectedCompany];
        if (!targetEl) return;

        // =========================================
        // AMBIL TANGGAL UNIK
        // =========================================
        const dates = [...new Set(salesStats.map(item => item.write_date))].sort();

        // =========================================
        // FORMAT TANGGAL
        // =========================================
        const categories = dates.map(date => {
            if (filterType === "year") {
                return date;
            }
            if (filterType === "month") {
                return dayjs(date + "-01").format("MMM YYYY");
            }
            return dayjs(date).format("DD MMM YYYY");
        });
        const isSinglePoint = dates.length === 1;
        // =========================================
        // CREATE SERIES
        // =========================================
        let series;

        if (selectedFilterBy === "company") {
            // Mode Company -> hanya 1 line chart untuk company yang dipilih
            const companyName =
            (salesStats[0] && salesStats[0].company) || selectedCompany;

            series = [{
                name: companyName,
                color: customerColors[0],
                data: dates.map(date => {
                    const item = salesStats.find(row => row.write_date === date);
                    return item ? Number(item.total_amount) / 1000000 : 0;
                })
            }];
        } else {
            // Mode Customer/Product/Brand -> banyak line, seperti sebelumnya
            series = visibleCustomers.map((customer) => {
                const originalIndex = customers.indexOf(customer);

                return {
                    name: customer,
                    color: customerColors[originalIndex % customerColors.length],
                    data: dates.map(date => {
                        const item = salesStats.find(
                            row => row.label === customer && row.write_date === date
                        );
                        return item ? Number(item.total_amount) / 1000000 : 0;
                    })
                };
            });
        }

        // =========================================
        // APEX CHART OPTIONS
        // =========================================
        const options = {
            chart: {
                type: isSinglePoint ? "bar" : "area",
                height: 200,
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 700,
                    animateGradually: { enabled: true, delay: 100 }
                }
            },
            series: series,
            xaxis: {
                categories: categories,
                labels: { rotate: -45 }
            },
            yaxis: {
                title: { text: 'Sales (Million)' },
                labels: {
                    formatter: function (value) {
                        return (value.toFixed(0) + ' M');
                    }
                }
            },
            stroke: { 
                width: isSinglePoint ? 0 : 3,
                curve:'straight'
            },
            markers: isSinglePoint ? {
                size: 0   // <-- sembunyikan marker kalau bar, tidak diperlukan
            } : {
                size: 4,
                colors: ["#3b82f6"],
                strokeColors: "#fff",
                strokeWidth: 2,
                hover: { size: 7 },
            },
            fill: isSinglePoint ? {
                opacity: 1   // <-- bar solid, tidak pakai gradient
            } : {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.2,
                    stops: [0, 90, 100],
                },
            },
            plotOptions: isSinglePoint ? {
                bar: {
                    columnWidth: "8%",
                    borderRadius: 4,
                }
            } : {},
            legend: { show: false },
            tooltip: {
                shared: true,
                intersect: false,
                custom: function ({ series, dataPointIndex, w }) {
                    let html = `
                        <div class="my-tooltip">
                            <div class="title">${w.globals.categoryLabels[dataPointIndex]}</div>
                    `;
                    w.globals.seriesNames.forEach((name, i) => {
                        const value = Number(series[i][dataPointIndex]);
                        if (!Number.isFinite(value) || value <= 0) {
                            return;
                        }
                        html += `
                            <div class="row">
                                <span class="dot" style="background:${w.globals.colors[i]}"></span>
                                <span class="name">${name}</span>
                                <span class="value">${value.toFixed(2)} Million</span>
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
                formatter: function (value) {
                    return formatCurrency(value * 1000000);
                },
            }
        };

        // =========================================
        // DESTROY & CREATE CHART
        // =========================================
        if (chartInstance.current[selectedCompany]) {
            chartInstance.current[selectedCompany].destroy();
        }

        chartInstance.current[selectedCompany] = new ApexCharts(targetEl, options);

        chartInstance.current[selectedCompany].render().then(() => {
            const markers = targetEl.querySelectorAll(".apexcharts-marker");

            if (showAllLabels) {
                markers.forEach(marker => { marker.style.opacity = "1"; });
                return;
            }

            markers.forEach(marker => { marker.style.opacity = "0"; });

            setTimeout(() => {
                markers.forEach(marker => {
                    marker.style.transition = "opacity 300ms";
                    marker.style.opacity = "1";
                });
            }, 700);
        });

        return () => {
            if (chartInstance.current[selectedCompany]) {
                chartInstance.current[selectedCompany].destroy();
                delete chartInstance.current[selectedCompany];
            }
        };
        // tambahkan selectedFilterBy ke dependency
    }, [salesStats, selectedCompany, selectedFilterBy]);
    useEffect(()=>{
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        axios.get(`${__API_URL__}/invoices/company_revenue`, {
            params
        })
        .then(res => {
            setCompanyRevenue(res.data);
        })
        .catch(console.error)
        .finally(() => {
            
        });
    },[]);
    useEffect(() => {
        if (!companyRevenue.length || !chartRef5.current) return;
        const targetEl = chartRef5.current[selectedCompany];
        if (!targetEl) return;
        const categories = companyRevenue.map(item => item.company);
        const totalAmount = companyRevenue.reduce(
            (sum, item) => sum + Number(item.total_amount),
            0
        );

        const seriesData = companyRevenue.map(item => {
            const value = Number(item.total_amount);
            return Number(((value / totalAmount) * 100).toFixed(2));
        });
        var basicbonut = {
            series: seriesData,
            chart: {
                height: 300,
                type: "donut",
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            stroke: {
                show: false,
            },
            labels: categories,
            colors: [
                "#8b5cf6",
                "#60a5fa",
                "#86efac",
                "#fbbf24",
                "#ef4444",
                "#1f2937"
            ],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200,
                        },
                    },
                },
            ],
            legend: {
                position: "bottom",
                formatter: function(seriesName, opts) {
                    return seriesName +
                        " &nbsp;&nbsp;&nbsp; " +
                        opts.w.globals.series[opts.seriesIndex].toFixed(1) + "%";
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "45%"   // sebelumnya sekitar 65%-70%
                    }
                }
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance5.current[selectedCompany]) {
            chartInstance5.current[selectedCompany].destroy();
        }

        chartInstance5.current[selectedCompany] = new ApexCharts(targetEl, basicbonut);
        chartInstance5.current[selectedCompany].render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance5.current[selectedCompany]) {
                chartInstance5.current[selectedCompany].destroy();
                delete chartInstance5.current[selectedCompany];
            }
        };
    },[companyRevenue, selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        if (selectedCustomer) {
            params.partner_id = selectedCustomer;
        }
        axios.get(`${__API_URL__}/invoices/company_invoices`, {
            params,
        })
        .then(res => {
            console.log(res.data);
            setInvoiceData(res.data);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany,
        selectedCustomer
    ]);
    useEffect(() => {
        if (!invoiceData.length || !selectedCompany) return;
        const targetEl = invoiceTableRef.current[selectedCompany];
        if (!targetEl) return;

        if (invoiceDataTableInstance.current[selectedCompany]) {
            invoiceDataTableInstance.current[selectedCompany].destroy();
            invoiceDataTableInstance.current[selectedCompany] = null;
        }

        const paymentStateBadge = (state) => {
            const stateMap = {
                not_paid: { label: "Not Paid", className: "bg-danger/20 text-danger" },
                paid: { label: "Paid", className: "bg-success/20 text-success" },
                partial: { label: "Partial", className: "bg-warning/20 text-warning" },
                in_payment: { label: "In Payment", className: "bg-info/20 text-info" },
            };
            const config = stateMap[state] || { label: state, className: "bg-slate-100 text-slate-600" };
            return `<span class="px-2 py-1 rounded-md text-xs font-medium ${config.className}">${config.label}</span>`;
        };

        // Bangun HTML tabel produk untuk child row
        const buildProductDetailHtml = (rowData) => {
            const origin = rowData.invoice_origin;

            if (!origin || !Array.isArray(origin) || origin.length === 0) {
                return `<div class="p-3 text-sm text-muted">Tidak ada detail produk</div>`;
            }

            // Kumpulkan semua lines dari semua origin, filter qty_invoiced != 0
            const allLines = [];
            origin.forEach((o) => {
                if (o.lines && Array.isArray(o.lines)) {
                    o.lines.forEach((line) => {
                        if (line.qty_invoiced && line.qty_invoiced !== 0) {
                            allLines.push(line);
                        }
                    });
                }
            });

            if (allLines.length === 0) {
                return `<div class="p-3 text-sm bg-blue-400 text-muted">Tidak ada detail produk</div>`;
            }

            let rows = "";
            allLines.forEach((line) => {
                const template = line.product_template || {};
                const productName = template.name || "-";
                const brand = template.x_studio_brand && Array.isArray(template.x_studio_brand)
                    ? template.x_studio_brand[1]
                    : "-";
                const categName = template.categ_id && Array.isArray(template.categ_id)
                    ? template.categ_id[1]
                    : "-";

                rows += `
                    <tr class="border-b border-slate-100 dark:border-slate-700">
                        <td class="py-1.5 px-2">${productName}</td>
                        <td class="py-1.5 px-2">${brand}</td>
                        <td class="py-1.5 px-2">${categName}</td>
                        <td class="py-1.5 px-2 text-right">${formatRupiah(line.price_unit)}</td>
                        <td class="py-1.5 px-2 text-right">${line.qty_invoiced}</td>
                        <td class="py-1.5 px-2 text-right">${formatRupiah(line.price_subtotal)}</td>
                    </tr>
                `;
            });

            return `
                <div class="p-3 bg-slate-50 dark:bg-slate-900">
                    <div class="max-h-[250px] overflow-y-auto">
                        <table class="w-full text-xs">
                            <thead class="sticky top-0 bg-slate-50 dark:bg-slate-900">
                                <tr class="border-b bg-blue-200 border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                                    <th class="py-1.5 px-2">Product Name</th>
                                    <th class="py-1.5 px-2">Brand</th>
                                    <th class="py-1.5 px-2">Category</th>
                                    <th class="py-1.5 px-2 text-right">Price Unit</th>
                                    <th class="py-1.5 px-2 text-right">Qty Invoiced</th>
                                    <th class="py-1.5 px-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        };

        const table = $(targetEl).DataTable({
            data: invoiceData,
            destroy: true,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            order: [[1, "desc"]],
            columns: [
                {
                    title: "No",
                    data: null,
                    className: "text-center",
                    render: function (data, type, row, meta) {
                        return meta.settings._iDisplayStart + meta.row + 1;
                    }
                },
                {
                    title: "Invoice Date",
                    data: "invoice_date",
                    render: function (data) {
                        return dayjs(data).format("DD MMM YYYY");
                    }
                },
                {
                    title: "Customer",
                    data: "customer_name",
                },
                {
                    title: "Total",
                    data: "amount_total",
                    className: "text-right",
                    render: function (data) {
                        return formatRupiah(data);
                    }
                },
                {
                    title: "Tax",
                    data: "amount_tax",
                    className: "text-right",
                    render: function (data) {
                        return formatRupiah(data);
                    }
                },
                {
                    title: "Paid",
                    data: "amount_paid",
                    className: "text-right",
                    render: function (data) {
                        return formatRupiah(data);
                    }
                },
                {
                    title: "Outstanding",
                    data: "amount_residual",
                    className: "text-right",
                    render: function (data) {
                        return `<span class="text-purple font-medium">${formatRupiah(data)}</span>`;
                    }
                },
                {
                    title: "Status",
                    data: "payment_state",
                    render: function (data) {
                        return paymentStateBadge(data);
                    }
                },
                {
                    title: "Due Date",
                    data: "invoice_date_due",
                    render: function (data) {
                        return dayjs(data).format("DD MMM YYYY");
                    }
                },
            ],
            language: {
                search: "Search:",
                info: "Showing _START_ to _END_ of _TOTAL_ invoices",
                paginate: {
                    previous: "Prev",
                    next: "Next",
                },
            },
            createdRow: function (row) {
                // Tambahkan style cursor pointer & hint bahwa baris bisa diklik
                $(row).css("cursor", "pointer");
            },
        });

        invoiceDataTableInstance.current[selectedCompany] = table;

        // Event klik baris untuk expand/collapse child row
        $(targetEl).off("click", "tbody tr").on("click", "tbody tr", function () {
            const tr = $(this);
            const row = table.row(tr);

            if (row.child.isShown()) {
                // Sudah terbuka -> tutup
                row.child.hide();
                tr.removeClass("shown");
            } else {
                // Tutup child row lain yang mungkin masih terbuka (opsional, biar rapi)
                table.rows().every(function () {
                    if (this.child.isShown()) {
                        this.child.hide();
                        $(this.node()).removeClass("shown");
                    }
                });

                // Buka child row untuk baris ini
                row.child(buildProductDetailHtml(row.data())).show();
                tr.addClass("shown");
            }
        });

        return () => {
            if (invoiceDataTableInstance.current[selectedCompany]) {
                invoiceDataTableInstance.current[selectedCompany].destroy();
                delete invoiceDataTableInstance.current[selectedCompany];
            }
        };
    }, [invoiceData, selectedCompany, showInvoiceDataModal]);
    useEffect(() => {
        if (!selectedCompany) return;
        if (!chartInstance.current[selectedCompany]) return;

        chartInstance.current[selectedCompany].updateOptions({
            dataLabels: {
                enabled: showAllLabels,
                enabledOnSeries: undefined,
                formatter(value) {
                    if (value <= 0) return "";
                    return formatCurrency(value * 1000000);   // samakan dengan formatter di useEffect utama
                }
            }
        });
    }, [showAllLabels, selectedCompany]);
    // useEffect(() => {
    //     const params = {};
    //     if (startDate && endDate && filterType) {
    //         params.start_date = startDate;
    //         params.end_date = endDate;
    //         params.filter_type = filterType;
    //     }
    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }
    //     axios.get(`${__API_URL__}/sales/number_of_customers`, {
    //         params,
    //     })
    //     .then(res => {
    //         setNumberOfCustomer(res.data);
    //     })
    //     .catch(error => {

    //     });

    // }, [
    //     startDate,
    //     endDate,
    //     filterType,
    //     selectedCompany
    // ]);
    // useEffect(() => {
    //     const params = {};
    //     if (startDate && endDate && filterType) {
    //         params.start_date = startDate;
    //         params.end_date = endDate;
    //         params.filter_type = filterType;
    //     }
    //     if (selectedCompany) {
    //         params.company_id = selectedCompany;
    //     }
    //     axios.get(`${__API_URL__}/sales/discount_given`, {
    //         params,
    //     })
    //     .then(res => {
    //         setDiscountGiven(res.data.total_discount);
    //     })
    //     .catch(error => {

    //     });

    // }, [
    //     startDate,
    //     endDate,
    //     filterType,
    //     selectedCompany
    // ]);
    // useEffect(() => {
    //     if (!reportYoy.length) return;
    //     if (!selectedCompany) return;
    //     const targetEl = chartRef3Map.current[selectedCompany];
    //     if (!targetEl) return;
    //     const positionShowValuesToggle = () => {
    //         const toggleEl = targetEl.querySelector(".show-values-toggle");
    //         const legendEl = targetEl.querySelector(".apexcharts-legend");
    //         const yaxisEl = targetEl.querySelector(".apexcharts-yaxis");

    //         if (!toggleEl || !legendEl) return;

    //         const containerRect = targetEl.getBoundingClientRect();
    //         const legendRect = legendEl.getBoundingClientRect();

    //         const legendTopRelative = legendRect.top - containerRect.top;

    //         // Kalau ada elemen yaxis, sejajarkan toggle dengan posisi kiri area plot chart
    //         let leftPosition = 30; // fallback default kalau yaxis tidak ditemukan
    //         // if (yaxisEl) {
    //         //     const yaxisRect = yaxisEl.getBoundingClientRect();
    //         //     leftPosition = yaxisRect.left - containerRect.left;
    //         // }

    //         toggleEl.style.left = `${leftPosition}px`;
    //         toggleEl.style.right = "auto";
    //         toggleEl.style.top = `${legendTopRelative}px`;
    //     };
    //     const monthNumbers = [...new Set(reportYoy.map(item => item.bulan.split('-')[1]))]
    //         .sort((a, b) => a - b);

    //     const monthNames = {
    //         '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    //         '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
    //         '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
    //     };

    //     const categories = monthNumbers.map(m => monthNames[m]);
    //     const years = [...new Set(reportYoy.map(item => item.bulan.split('-')[0]))].sort();

    //     const dataMap = {};
    //     reportYoy.forEach(item => {
    //         dataMap[item.bulan] = parseFloat(item.total_amount);
    //     });

    //     const seriesData = years.map(year => ({
    //         name: year,
    //         data: monthNumbers.map(m => dataMap[`${year}-${m}`] || 0),
    //     }));

    //     const allValues = seriesData.flatMap(s => s.data);
    //     const maxValue = Math.max(...allValues, 0);
    //     const yaxisMax = maxValue > 0
    //         ? Math.ceil((maxValue * 1.15) / 1000000) * 1000000
    //         : 1000000;

    //     const colors = ["#1d57a8", "#f0b429"];

    //     const styleId = `legend-style-${selectedCompany}`;
    //     let styleTag = document.getElementById(styleId);
    //     if (!styleTag) {
    //         styleTag = document.createElement("style");
    //         styleTag.id = styleId;
    //         document.head.appendChild(styleTag);
    //     }
    //     if (!targetEl.id) {
    //         targetEl.id = `chart3-${selectedCompany}`;
    //     }
    //     styleTag.innerHTML = `
    //         #${targetEl.id} .apexcharts-legend-series:nth-child(1) .apexcharts-legend-marker {
    //             background: ${colors[0]} !important;
    //             opacity: 1 !important;
    //         }
    //         #${targetEl.id} .apexcharts-legend-series:nth-child(2) .apexcharts-legend-marker {
    //             background: ${colors[1]} !important;
    //             opacity: 1 !important;
    //         }
    //         #${targetEl.id} .apexcharts-legend-series {
    //             margin-right: 24px !important;
    //             cursor: pointer !important;
    //         }
    //         #${targetEl.id} .apexcharts-legend-text,
    //         #${targetEl.id} .apexcharts-legend-marker {
    //             cursor: pointer !important;
    //         }
    //         #${targetEl.id} {
    //             position: relative !important;
    //             overflow: hidden !important;
    //         }
    //         #${targetEl.id} .show-values-toggle {
    //             position: absolute;
    //             display: flex;
    //             align-items: center;
    //             gap: 6px;
    //             font-size: 13px;
    //             font-family: Inter, sans-serif;
    //             color: #334155;
    //             z-index: 10;
    //             cursor: pointer;
    //             user-select: none;
    //             white-space: nowrap;
    //         }
    //         #${targetEl.id} .show-values-toggle input {
    //             cursor: pointer;
    //         }
    //     `;

    //     let isolatedIndex = null;
    //     let showAllValues = false;

    //     const getEnabledOnSeries = () => {
    //         if (showAllValues) {
    //             return seriesData.map((_, i) => i); // semua series
    //         }
    //         if (isolatedIndex !== null) {
    //             return [isolatedIndex];
    //         }
    //         return [];
    //     };

    //     const options = {
    //         chart: {
    //             height: 300,
    //             type: "bar",
    //             zoom: { enabled: false },
    //             toolbar: { show: false },
    //             animations: {
    //                 enabled: true,
    //                 speed: 800,
    //                 animateGradually: { enabled: true, delay: 100 },
    //                 dynamicAnimation: { enabled: true, speed: 800 },
    //             },
    //             events: {
    //                 legendClick: function (chartContext, seriesIndex, config) {
    //                     if (isolatedIndex === seriesIndex) {
    //                         isolatedIndex = null;
    //                         seriesData.forEach((s) => {
    //                             chartContext.showSeries(s.name);
    //                         });
    //                     } else {
    //                         isolatedIndex = seriesIndex;
    //                         seriesData.forEach((s, i) => {
    //                             if (i === seriesIndex) {
    //                                 chartContext.showSeries(s.name);
    //                             } else {
    //                                 chartContext.hideSeries(s.name);
    //                             }
    //                         });
    //                     }
    //                     setTimeout(() => {
    //                         chartContext.updateOptions({
    //                             dataLabels: { enabledOnSeries: getEnabledOnSeries() },
    //                         }, false, true).then(() => {
    //                             removeInlineTitleStyle();
    //                             injectShowValuesToggle();
    //                             reattachTitleObserver();
    //                             positionShowValuesToggle();
    //                         });
    //                     }, 50);
    //                 },
    //             },
    //         },
    //         title: {
    //             text: "Sales Comparison Year Over Year",
    //             align: "center",
    //             margin: 20,
    //         },
    //         series: seriesData,
    //         plotOptions: {
    //             bar: {
    //                 borderRadius: 4,
    //                 columnWidth: "60%",
    //                 dataLabels: { position: "top" },
    //             },
    //         },
    //         dataLabels: {
    //             enabled: true,
    //             enabledOnSeries: [],
    //             offsetY: -20,
    //             style: {
    //                 fontSize: "11px",
    //                 fontWeight: 600,
    //                 colors: ["#334155"],
    //             },
    //             background: { enabled: false },
    //             formatter: function (value) {
    //                 if (!value) return "";
    //                 return formatCurrency(value);
    //             },
    //         },
    //         stroke: { show: false },
    //         colors: colors,
    //         labels: categories,
    //         xaxis: {
    //             categories: categories,
    //             axisBorder: { show: false },
    //             axisTicks: { show: false },
    //             labels: {
    //                 offsetX: 0,
    //                 offsetY: 5,
    //                 style: { fontSize: "12px", cssClass: "apexcharts-xaxis-title" },
    //             },
    //         },
    //         yaxis: {
    //             min: 0,
    //             max: yaxisMax,
    //             tickAmount: 5,
    //             forceNiceScale: true,
    //             labels: {
    //                 offsetX: -10,
    //                 offsetY: 0,
    //                 style: { fontSize: "12px", cssClass: "apexcharts-yaxis-title" },
    //                 formatter: function (value) {
    //                     return formatCurrency(value);
    //                 },
    //             },
    //             opposite: false,
    //         },
    //         grid: {
    //             show: true,
    //             borderColor: "#e5e7eb",
    //             strokeDashArray: 0,
    //             xaxis: { lines: { show: false } },
    //             yaxis: { lines: { show: true } },
    //             padding: { top: 0, right: 0, bottom: 0, left: 0 },
    //         },
    //         legend: {
    //             show: true,
    //             position: "top",
    //             horizontalAlign: "right",
    //             markers: {
    //                 width: 12,
    //                 height: 12,
    //                 radius: 3,
    //                 offsetX: -4,
    //             },
    //             fontSize: "13px",
    //             labels: { colors: "#334155" },
    //             onItemClick: { toggleDataSeries: false },
    //         },
    //         tooltip: {
    //             marker: { show: true },
    //             y: {
    //                 formatter: function (value) {
    //                     return formatCurrency(value);
    //                 },
    //             },
    //         },
    //     };

    //     if (chartInstance3Map.current[selectedCompany]) {
    //         chartInstance3Map.current[selectedCompany].destroy();
    //     }

    //     chartInstance3Map.current[selectedCompany] = new ApexCharts(targetEl, options);

    //     const removeInlineTitleStyle = () => {
    //         const titleEl = targetEl.querySelector(".apexcharts-title-text");
    //         if (titleEl) {
    //             titleEl.removeAttribute("style");
    //             titleEl.removeAttribute("font-family");
    //             titleEl.setAttribute("font-size", "16px");
    //         }
    //     };
    //     let titleObserver = null;

    //     const reattachTitleObserver = () => {
    //         if (titleObserver) {
    //             titleObserver.disconnect();
    //         }
    //         const titleEl = targetEl.querySelector(".apexcharts-title-text");
    //         if (titleEl) {
    //             titleObserver = new MutationObserver(() => {
    //                 removeInlineTitleStyle();
    //             });
    //             titleObserver.observe(titleEl, {
    //                 attributes: true,
    //                 attributeFilter: ["style", "font-family","font-size"],
    //             });
    //         }
    //     };
    //     // ============================================
    //     // INJECT CHECKBOX "Show Values"
    //     // ============================================
    //     const injectShowValuesToggle = () => {
    //         // Hapus dulu kalau sudah ada (hindari duplikat saat re-render)
    //         const existing = targetEl.querySelector(".show-values-toggle");
    //         if (existing) existing.remove();

    //         const wrapper = document.createElement("label");
    //         wrapper.className = "show-values-toggle";

    //         const checkbox = document.createElement("input");
    //         checkbox.type = "checkbox";
    //         checkbox.checked = showAllValues;

    //         const text = document.createElement("span");
    //         text.textContent = "Show Values";

    //         checkbox.addEventListener("change", (e) => {
    //             showAllValues = e.target.checked;
    //             if (chartInstance3Map.current[selectedCompany]) {
    //                 chartInstance3Map.current[selectedCompany].updateOptions({
    //                     dataLabels: { enabledOnSeries: getEnabledOnSeries() },
    //                 }, false, true).then(() => {
    //                     removeInlineTitleStyle();
    //                     injectShowValuesToggle();
    //                     reattachTitleObserver();
    //                     positionShowValuesToggle();   // <-- tambahkan ini juga
    //                 });
    //             }
    //         });

    //         wrapper.appendChild(checkbox);
    //         wrapper.appendChild(text);
    //         targetEl.appendChild(wrapper);
    //     };

    //     chartInstance3Map.current[selectedCompany].render().then(() => {
    //         removeInlineTitleStyle();
    //         injectShowValuesToggle();
    //         reattachTitleObserver();
    //         positionShowValuesToggle();
    //     });

    //     return () => {
    //         if (chartInstance3Map.current[selectedCompany]) {
    //             chartInstance3Map.current[selectedCompany].destroy();
    //             delete chartInstance3Map.current[selectedCompany];
    //         }
    //         const oldStyleTag = document.getElementById(styleId);
    //         if (oldStyleTag) {
    //             oldStyleTag.remove();
    //         }
    //         if (titleObserver) {
    //             titleObserver.disconnect();
    //         }
    //     };
    // }, [reportYoy, selectedCompany]);
    // useEffect(() => {
    //     if (!reportMom.length || !chartRef4.current) return;
    //     const targetEl = chartRef4.current[selectedCompany];
    //     if (!targetEl) return;

    //     const filtered = reportMom.filter(item => item.persen_perubahan !== null);

    //     const categories = filtered.map(item => {
    //         const [, month] = item.bulan.split('-');
    //         const monthNames = {
    //             '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    //             '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
    //             '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
    //         };
    //         return monthNames[month];
    //     });

    //     const seriesData = filtered.map(item => Number(item.persen_perubahan));

    //     const options = {
    //         chart: {
    //             type: "line",
    //             height: 300,
    //             toolbar: { show: false },
    //             zoom: { enabled: false },
    //         },
    //         series: [{ name: "MoM Growth %", data: seriesData }],
    //         title: {
    //             text: `Monthly Sales Growth % (${categories[0]} - ${categories[categories.length - 1]})`,
    //             align: "center",
    //         },
    //         colors: ["#2f4f5f"],
    //         stroke: { width: 3, curve: "straight" },
    //         markers: {
    //             size: 5,
    //             colors: ["#2f4f5f"],
    //             strokeColors: "#fff",
    //             strokeWidth: 2,
    //             hover: { size: 7 },
    //         },
    //         dataLabels: {
    //             enabled: true,
    //             offsetY: -12,
    //             style: { fontSize: "11px", fontWeight: 600, colors: ["#334155"] },
    //             background: { enabled: false },
    //             formatter: function (value) {
    //                 return value.toFixed(1) + "%";
    //             },
    //         },
    //         xaxis: {
    //             categories: categories,
    //             axisBorder: {
    //                 show: true,
    //                 color: "#e5e7eb",
    //                 height: 1,
    //             },
    //             axisTicks: { show: false },
    //             labels: { style: { fontSize: "12px" } },
    //         },
    //         yaxis: {
    //             show: true,
    //             tickAmount: 5,
    //             labels: {
    //                 style: {
    //                     fontSize: "12px",
    //                     colors: "#64748b",
    //                 },
    //                 formatter: function (value) {
    //                     return value.toFixed(0) + "%";
    //                 },
    //             },
    //             axisBorder: { show: false },
    //             axisTicks: { show: false },
    //         },
    //         grid: {
    //             show: true,
    //             borderColor: "#e5e7eb",
    //             strokeDashArray: 0,   // <-- ubah dari 3 ke 0 supaya solid
    //             xaxis: { lines: { show: false } },
    //             yaxis: { lines: { show: true } },
    //             padding: { top: 0, right: 20, bottom: 0, left: 10 },
    //         },
    //         annotations: {
    //             yaxis: [{ y: 0, borderColor: "#94a3b8", strokeDashArray: 4, borderWidth: 1 }],
    //         },
    //         legend: { show: false },
    //         tooltip: {
    //             y: {
    //                 formatter: function (value) {
    //                     return value.toFixed(2) + "%";
    //                 },
    //             },
    //         },
    //     };

    //     if (chartInstance4.current[selectedCompany]) {
    //         chartInstance4.current[selectedCompany].destroy();
    //     }

    //     chartInstance4.current[selectedCompany] = new ApexCharts(targetEl, options);
    //     const removeInlineTitleStyle = () => {
    //         const titleEl = targetEl.querySelector(".apexcharts-title-text");
    //         if (titleEl) {
    //             titleEl.removeAttribute("style");
    //             titleEl.removeAttribute("font-family");
    //             titleEl.setAttribute("font-size", "16px");
    //         }
    //     };

    //     let titleObserver = null;

    //     const reattachTitleObserver = () => {
    //         if (titleObserver) {
    //             titleObserver.disconnect();
    //         }
    //         const titleEl = targetEl.querySelector(".apexcharts-title-text");
    //         if (titleEl) {
    //             titleObserver = new MutationObserver(() => {
    //                 removeInlineTitleStyle();
    //             });
    //             titleObserver.observe(titleEl, {
    //                 attributes: true,
    //                 attributeFilter: ["style", "font-family", "font-size"],
    //             });
    //         }
    //     };
    //     chartInstance4.current[selectedCompany].render().then(() => {
    //         removeInlineTitleStyle();
    //         reattachTitleObserver();
    //     });

    //     return () => {
    //         if (chartInstance4.current[selectedCompany]) {
    //             chartInstance4.current[selectedCompany].destroy();
    //             delete chartInstance4.current[selectedCompany];
    //         }
    //         if (titleObserver) {
    //             titleObserver.disconnect();
    //         }
    //     };
    // }, [reportMom, selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        if (showAllCustomers) {
            params.show_all = "true";
        }
        axios.get(`${__API_URL__}/invoices/top_customers`, {
            params,
        })
        .then(res => {
            setTopCustomers(res.data);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany,
        showAllCustomers
    ]);
    useEffect(() => {
        const params = {};

        if (selectedCompany) {
            params.company_id = selectedCompany;
        }

        axios.get(`${__API_URL__}/invoices/aging_analys`, {
            params,
        })
        .then(res => {
            setAgingAnalysis(res.data);
        })
        .catch(error => {
            console.error(error);
        });
    }, [selectedCompany]);
    const formatShort = (value) => {
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(1) + "B";
        }
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + "M";
        }
        return value.toLocaleString("id-ID");
    };
    useEffect(() => {
        if (!agingAnalysis.length || !chartRef6.current) return;
        const targetEl = chartRef6.current[selectedCompany];
        if (!targetEl) return;

        const bucketOrder = ["0-30 Days", "31-60 Days", "61-90 Days", ">90 Days"];

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
                enabled: showAllLabels2,
                offsetY: -20,
                style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: ["#334155"],
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return formatShort(value);
                },
            },
            xaxis: {
                categories: bucketOrder,
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
                strokeDashArray: 0,
                xaxis: { lines: { show: false } },
                yaxis: { lines: { show: true } },
                padding: { top: 0, right: 20, bottom: 0, left: 10 },
            },
            legend: { show: false },
            tooltip: {
                y: {
                    formatter: function (value) {
                        return formatCurrency(value);
                    },
                },
            },
        };

        if (chartInstance6.current[selectedCompany]) {
            chartInstance6.current[selectedCompany].destroy();
        }

        chartInstance6.current[selectedCompany] = new ApexCharts(targetEl, options);
        chartInstance6.current[selectedCompany].render();

        return () => {
            if (chartInstance6.current[selectedCompany]) {
                chartInstance6.current[selectedCompany].destroy();
                delete chartInstance6.current[selectedCompany];
            }
        };
    // showAllLabels2 SENGAJA tidak dimasukkan di sini, ditangani effect terpisah di bawah
    }, [agingAnalysis, selectedCompany]);

    // EFFECT 2: Update dataLabels saja saat checkbox berubah, tanpa render ulang chart
    useEffect(() => {
        if (!selectedCompany) return;
        if (!chartInstance6.current[selectedCompany]) return;

        chartInstance6.current[selectedCompany].updateOptions({
            dataLabels: {
                enabled: showAllLabels2,
                offsetY: -20,
                style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: ["#334155"],
                },
                formatter: function (value) {
                    if (value <= 0) return "";
                    return formatShort(value);
                },
            },
        }, false, false);
    }, [showAllLabels2, selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        axios.get(`${__API_URL__}/invoices/top_category`, {
            params,
        })
        .then(res => {
            setTopCategory(res.data);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany
    ]);
    useEffect(() => {
        if (!topCategory.length) return;
        if (!selectedCompany) return;
        const targetEl = chartRefCategory.current[selectedCompany];
        if (!targetEl) return;

        const seriesData = topCategory.map(item => Number(item.total_amount));
        const labels = topCategory.map(item => item.categ_name);
        const totalAmount = topCategory.reduce((sum, item) => sum + Number(item.total_amount), 0);

        const options = {
            chart: {
                type: "donut",
                height: 220,
                toolbar: { show: false },
            },
            series: seriesData,
            labels: labels,
            colors: categoryColors,
            stroke: { show: false },
            dataLabels: { enabled: false },
            legend: { show: false }, // legend custom dibuat manual di JSX
            plotOptions: {
                pie: {
                    donut: {
                        size: "72%",
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
                                    return formatCurrency(totalAmount);
                                },
                            },
                        },
                    },
                },
            },
            tooltip: {
                y: {
                    formatter: function (value) {
                        return formatCurrency(value);
                    },
                },
            },
        };
        if (chartInstanceCategory.current[selectedCompany]) {
            chartInstanceCategory.current[selectedCompany].destroy();
        }

        chartInstanceCategory.current[selectedCompany] = new ApexCharts(targetEl, options);

        chartInstanceCategory.current[selectedCompany].render();
        return () => {
            if (chartInstanceCategory.current[selectedCompany]) {
                chartInstanceCategory.current[selectedCompany].destroy();
                delete chartInstanceCategory.current[selectedCompany];
            }
        };
    }, [topCategory, selectedCompany]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        if (showAllProducts) {
            params.show_all = "true";
        }
        axios.get(`${__API_URL__}/invoices/top_products`, {
            params,
        })
        .then(res => {
            setTopProducts(res.data);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany,
        showAllProducts
    ]);
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        if (showAllBrands) {
            params.show_all = "true";
        }
        axios.get(`${__API_URL__}/invoices/top_brands`, {
            params,
        })
        .then(res => {
            setTopBrands(res.data);
        })
        .catch(error => {

        });

    }, [
        startDate,
        endDate,
        filterType,
        selectedCompany,
        showAllBrands
    ]);
    const formatRupiah = (value) => {
        const amount = Number(value);

        if (isNaN(amount)) return "-";

        // Jika < 1 juta
        return `Rp.`+new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2
        }).format(amount);
    };
    const formatCurrency = (value) => {
        const amount = Number(value);

        if (isNaN(amount)) return "-";

        // Jika >= 1 miliar
        if (amount >= 1_000_000_000) {
            return `Rp. ${(amount / 1_000_000_000).toFixed(2)}B`;
        }

        // Jika >= 1 juta
        if (amount >= 1_000_000) {
            return `Rp. ${(amount / 1_000_000).toFixed(2)}M`;
        }
        if (amount >= 1_000) {
            return `Rp. ${(amount / 1_000).toFixed(2)}K`;
        }

        // Jika < 1 juta
        return `Rp.`+new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2
        }).format(amount);
    };
    return (
        <div>
            <div class="grid grid-cols-1">
                <div className="flex">
                    <button type="button" onClick={() => setIsOpen(!isOpen)} 
                        className={`flex items-center px-4 pb-2 text-muted ${
                            isOpen ? "!text-black dark:!text-white" : ""
                        }`}
                    >
                        <div className="flex">
                            <i className="fa-solid fa-filter dark:text-white text-sm"></i>

                            <span className="ml-2 dark:text-white text-dark">
                                Filter
                            </span>

                            {/* Arrow */}
                            
                            &nbsp;| {filterLabel}
                            <div className={`ltr:ml-auto rtl:mr-auto transition-transform duration-300 pt-1 ${
                                    isOpen ? "rotate-180" : ""
                                }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    className="size-5"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M11.9997 13.1714L16.9495 8.22168L18.3637 9.63589L11.9997 15.9999L5.63574 9.63589L7.04996 8.22168L11.9997 13.1714Z"
                                    />
                                </svg>
                            </div>
                        </div>
                        
                    </button>
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-darkborder/40 rounded-xl w-fit">
                        {dateFilterOptions.map((option) => (
                            <label
                                key={option.value}
                                className={`
                                    relative flex items-center px-4 py-2 rounded-lg text-sm font-medium
                                    cursor-pointer transition-all duration-200 select-none
                                    ${
                                        selectedRadio === option.value
                                            ? "bg-white dark:bg-slate-800 text-purple shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    }
                                `}
                            >
                                <input
                                    type="radio"
                                    name="radio-one"
                                    className="sr-only"
                                    checked={selectedRadio === option.value}
                                    onChange={() => {
                                        setSelectedRadio(option.value);
                                        handleRadioChange(option.value);
                                    }}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="px-4 py-2 space-y-2 border-t text-muted border-slate-200 dark:border-darkborder">

                        <div className="flex flex-wrap gap-4">

                            {/* DATE */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Date
                                </label>

                                <RangePicker
                                    presets={rangePresets}
                                    value={defaultDates}
                                    onChange={onRangeChange}
                                    className={
                                        defaultDates
                                            ? "range-picker-date active"
                                            : "range-picker-date"
                                    }
                                />
                            </div>

                            {/* MONTH */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Month
                                </label>

                                <RangePicker
                                    picker="month"
                                    value={monthDates}
                                    onChange={onMonthRangeChange}
                                    className={
                                        monthDates
                                            ? "range-picker-month active"
                                            : "range-picker-month"
                                    }
                                />
                            </div>

                            {/* YEAR */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                                    Year
                                </label>

                                <RangePicker
                                    picker="year"
                                    value={yearDates}
                                    onChange={onYearRangeChange}
                                    className={
                                        yearDates
                                            ? "range-picker-year active"
                                            : "range-picker-year"
                                    }
                                    id={{
                                        start: "startInput",
                                        end: "endInput",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1">
                <div>
                    <ul className="flex flex-nowrap overflow-x-auto -mb-px text-sm text-center border-b border-slate-200 dark:border-darkborder">
                        {companies.map((company) => (
                            <li
                                key={company.id}
                                className="ltr:mr-2 rtl:ml-2 flex-shrink-0"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleCompanyClick(company.id)}
                                    className={`inline-flex p-4 ${
                                        selectedCompany === company.id
                                            ? "text-purple border-b-2 border-purple"
                                            : "text-muted border-b-2 border-transparent rounded-t-lg hover:text-purple hover:border-purple"
                                    }`}
                                >
                                    {company.name}
                                </button>
                            </li>
                        ))}
                    </ul>


                    {/* TAB CONTENT */}
                    <div
                        ref={contentRef}
                        onScroll={handleContentScroll}
                        className="
                            mt-3
                            text-[13px]
                            flex
                            overflow-x-auto
                            overflow-y-hidden
                            scroll-smooth
                            snap-x
                            snap-mandatory
                            hide-scrollbar
                    "
                    >
                        
                        {companies.map((company) => (
                            <div
                                className="min-w-full snap-start"
                                key={company.id}
                            >
                                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-6 mt-2">
                                    {reportYtd && reportYtd.length > 0 && (() => {
                                        const data = reportYtd[0];
                                        const totalTahunIni = parseFloat(data.total_tahun_ini);
                                        const totalTahunLalu = parseFloat(data.total_tahun_lalu);
                                        const persenPerubahan = parseFloat(data.persen_perubahan);
                                        const selisih = totalTahunIni - totalTahunLalu;
                                        const isNaik = persenPerubahan >= 0;

                                        return (
                                            <div className="card col-span-1 p-2 pt-5">
                                                <div class="flex">
                                                    <div className="px-2 pt-2">
                                                        <img 
                                                            src="/assets/images/barchart white.png" 
                                                            alt="Sales Chart Icon" 
                                                            className="w-16 h-16 img-light" 
                                                        />
                                                        <img 
                                                            src="/assets/images/barchart dark.png" 
                                                            alt="Sales Chart Icon" 
                                                            className="w-16 h-16 img-dark" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                                            <span>&nbsp;Current Year Sales</span>
                                                        </div>
                                                        <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                                            {formatCurrency(totalTahunIni)}
                                                        </h4>
                                                        <p className="text-muted text-sm mb-1">({data.label_tahun_ini})</p>
                                                        <div class="text-right">
                                                            <button 
                                                                className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                                                onClick={() => setShowStatsModal(true)}
                                                            >
                                                                see stats
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {reportYtd && reportYtd.length > 0 && (() => {
                                        const data = reportYtd[0];
                                        const totalTahunIni = parseFloat(data.total_tahun_ini);
                                        const totalTahunLalu = parseFloat(data.total_tahun_lalu);
                                        const persenPerubahan = parseFloat(data.persen_perubahan);
                                        const selisih = totalTahunIni - totalTahunLalu;
                                        const isNaik = persenPerubahan >= 0;

                                        return (
                                            <div className="card col-span-1 p-2 pt-5">
                                                <div class="flex">
                                                    <div className="px-2 pt-2">
                                                        <img 
                                                            src="/assets/images/arrow chart white.png" 
                                                            alt="Sales Chart Icon" 
                                                            className="w-16 h-16 img-light" 
                                                        />
                                                        <img 
                                                            src="/assets/images/arrow chart dark.png" 
                                                            alt="Sales Chart Icon" 
                                                            className="w-16 h-16 img-dark" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                                            <span>&nbsp;Sales Growth</span>
                                                        </div>
                                                        <h4
                                                            className={`flex mb-2 items-center text-2xl font-semibold ${
                                                                isNaik
                                                                    ? "text-success"
                                                                    : "text-danger"
                                                            }`}
                                                        >
                                                        <i className={isNaik ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>{" "}
                                                            {Math.abs(persenPerubahan).toFixed(1)}%
                                                        </h4>
                                                        <p className="text-muted text-sm mb-1">VS {data.label_tahun_lalu}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <div className="card col-span-1 p-2 pt-5">
                                        <div class="flex">
                                            <div className="px-2 pt-2">
                                                <img 
                                                    src="/assets/images/revenue white.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-light" 
                                                />
                                                <img 
                                                    src="/assets/images/revenue dark.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-dark" 
                                                />
                                            </div>
                                            <div>
                                                <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                                    <span>&nbsp;Revenue</span>
                                                </div>
                                                <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                                    {formatCurrency(totalSales)}
                                                </h4>
                                                <p className="text-muted text-sm mb-1">({filterLabel})</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card col-span-1 p-2 pt-5">
                                        <div class="flex">
                                            <div className="px-2 pt-2">
                                                <img 
                                                    src="/assets/images/order white.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-light" 
                                                />
                                                <img 
                                                    src="/assets/images/order dark.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-dark" 
                                                />
                                            </div>
                                            <div>
                                                <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                                    <span>&nbsp;Total Invoice</span>
                                                </div>
                                                <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                                    {totalOrder}
                                                </h4>
                                                <p className="text-muted text-sm mb-1">Invoice</p>
                                                <div class="text-right">
                                                    <button 
                                                        className="text-white bg-yellow-500 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-yellow-600"
                                                        onClick={() => {
                                                            setShowInvoiceDataModal(true);
                                                            setSelectedCustomer("");
                                                        }}
                                                    >
                                                        see data
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card col-span-1 p-2 pt-5">
                                        <div class="flex">
                                            <div className="px-2 pt-2">
                                                <img 
                                                    src="/assets/images/outstanding white.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-light" 
                                                />
                                                <img 
                                                    src="/assets/images/outstanding dark.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-dark" 
                                                />
                                            </div>
                                            <div>
                                                <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                                    <span>&nbsp;Outstanding Balance</span>
                                                </div>
                                                <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                                    {formatCurrency(companyResidual.residual_amount)}
                                                </h4>
                                                <p className="text-muted text-sm mb-1">({filterLabel})</p>
                                                <div class="text-right">
                                                    <button 
                                                        className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                                        onClick={() => {
                                                            setActiveTrendSeries("Outstanding Amount");
                                                            setShowStatsOutstandingModal(true);
                                                        }}
                                                    >
                                                        see stats
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card col-span-1 p-2 pt-5">
                                        <div class="flex">
                                            <div className="px-2 pt-2">
                                                <img 
                                                    src="/assets/images/amount paid white.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-light rounded-full" 
                                                />
                                                <img 
                                                    src="/assets/images/amount paid dark.png" 
                                                    alt="Sales Chart Icon" 
                                                    className="w-16 h-16 img-dark rounded-full" 
                                                />
                                            </div>
                                            <div>
                                                <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                                    <span>&nbsp;Total Amount Paid</span>
                                                </div>
                                                <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                                    {formatCurrency(companyPaid.amount_paid)}
                                                </h4>
                                                <p className="text-muted text-sm mb-1">({filterLabel})</p>
                                                <div class="text-right">
                                                    <button 
                                                        className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                                        onClick={() => {
                                                            setActiveTrendSeries("Amount Paid");
                                                            setShowStatsOutstandingModal(true);
                                                        }}
                                                    >
                                                        see stats
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 mt-2">
                                    <div class="col-span-12 xl:col-span-5 p-6 min-h-0 card">
                                        {salesStats.length > 0 ? (
                                            <div class="grid grid-cols-12">
                                                <div className={selectedFilterBy === 'company' ? 'col-span-12' : 'col-span-8'}>
                                                    <div className="flex flex-col">
                                                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                                                            Sales Trend
                                                        </h2>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={showAllLabels}
                                                                    onChange={(e) => setShowAllLabels(e.target.checked)}
                                                                />
                                                                <span>Show All Values</span>
                                                            </div>
                                                            {/* <div className="grid grid-cols-12 pt-2">
                                                                <div className="col-span-1 pt-2">Filter By</div>
                                                                <div className="col-span-3">
                                                                    <select
                                                                        className="form-select w-auto dark:bg-dark h-10"
                                                                        value={selectedFilterBy}
                                                                        onChange={(e) => setSelectedFilterBy(e.target.value)}
                                                                    >
                                                                        <option value="company">Company</option>
                                                                        <option value="customer">Customer</option>
                                                                        <option value="product">Product</option>
                                                                        <option value="brand">Brand</option>
                                                                    </select>
                                                                </div>
                                                            </div> */}
                                                        </div>
                                                        <div className="grid grid-cols-1">
                                                            <div
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        chartRef.current[company.id] = el;
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-12">
                                                            <div className="col-span-4 h-16">
                                                                {reportMtd && reportMtd.length > 0 && (() => {
                                                                    const data = reportMtd[0];
                                                                    const totalBulanIni = parseFloat(data.total_bulan_ini);
                                                                    const totalBulanLalu = parseFloat(data.total_bulan_lalu);
                                                                    const persenPerubahan = parseFloat(data.persen_perubahan);
                                                                    const selisih = totalBulanIni - totalBulanLalu;
                                                                    const isNaik = persenPerubahan >= 0;

                                                                    return (
                                                                        <div className="flex flex-col items-center col-span-1 border border-gray-300">
                                                                            <div className="text-md dark:text-gray-300">
                                                                                MTD ({data.label_bulan_ini})
                                                                            </div>
                                                                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                                                                {formatCurrency(totalBulanIni)}
                                                                            </h4>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="col-span-4">
                                                                {reportMtd && reportMtd.length > 0 && (() => {
                                                                    const data = reportMtd[0];
                                                                    const totalBulanIni = parseFloat(data.total_bulan_ini);
                                                                    const totalBulanLalu = parseFloat(data.total_bulan_lalu);
                                                                    const persenPerubahan = parseFloat(data.persen_perubahan);
                                                                    const selisih = totalBulanIni - totalBulanLalu;
                                                                    const isNaik = persenPerubahan >= 0;

                                                                    return (
                                                                        <div className="flex flex-col items-center col-span-1 border border-gray-300">
                                                                            <div className="text-md dark:text-gray-300">
                                                                                Previous ({data.label_bulan_lalu})
                                                                            </div>
                                                                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                                                                {formatCurrency(totalBulanLalu)}
                                                                            </h4>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="col-span-4">
                                                                {reportMtd && reportMtd.length > 0 && (() => {
                                                                    const data = reportMtd[0];
                                                                    const totalBulanIni = parseFloat(data.total_bulan_ini);
                                                                    const totalBulanLalu = parseFloat(data.total_bulan_lalu);
                                                                    const persenPerubahan = parseFloat(data.persen_perubahan);
                                                                    const selisih = totalBulanIni - totalBulanLalu;
                                                                    const isNaik = persenPerubahan >= 0;

                                                                    return (
                                                                        <div className="flex flex-col items-center col-span-1 border border-gray-300">
                                                                            <div className="text-md dark:text-gray-300">
                                                                                Growth
                                                                            </div>
                                                                            <h4 className="flex items-center gap-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                                                                                <span
                                                                                    className={`p-1 leading-none rounded-md ${
                                                                                        isNaik
                                                                                            ? "text-success"
                                                                                            : "text-danger"
                                                                                    }`}
                                                                                >
                                                                                    <i className={isNaik ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>{" "}
                                                                                    {Math.abs(persenPerubahan).toFixed(1)}%
                                                                                </span>
                                                                            </h4>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedFilterBy !== 'company' && (
                                                    <div className="col-span-4">
                                                        {
                                                            salesStats.length > 0 && (
                                                                <>
                                                                    {!isSingleDate || isSingleDate ? (
                                                                        <div className="shrink-0 border-l border-slate-200 dark:border-slate-700 pl-5">
                                                                            <div className="shrink-0 border-l border-slate-200 dark:border-slate-700 pl-5">
                                                                                <input
                                                                                    type="text"
                                                                                    value={searchCustomer}
                                                                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                                                                    placeholder="Find customer or company"
                                                                                    className="
                                                                                        w-full
                                                                                        h-8
                                                                                        px-2
                                                                                        py-1
                                                                                        mb-2
                                                                                        text-sm
                                                                                        border
                                                                                        rounded
                                                                                        outline-none
                                                                                        focus:ring-2
                                                                                        focus:ring-blue-500
                                                                                        dark:bg-dark
                                                                                        dark:text-white
                                                                                        dark:border-slate-700
                                                                                    "
                                                                                />
                                                                                <label className="flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="form-checkbox"
                                                                                        // checked={crossOutAll}
                                                                                        onChange={(e) => {
                                                                                            const checked = e.target.checked;

                                                                                            // setCrossOutAll(checked);
                                                                                            // handleCrossOutAll(checked);
                                                                                        }}
                                                                                    />

                                                                                    <span className="ml-2">
                                                                                        Select Multiple
                                                                                    </span>
                                                                                </label>
                                                                                <div
                                                                                    className="overflow-y-auto"
                                                                                    style={{ maxHeight: "350px" }}
                                                                                >
                                                                                    {companyGroups
                                                                                    .map(group => {
                                                                                        const keyword = searchCustomer.trim().toLowerCase();

                                                                                        const companyMatch =
                                                                                            group.company.toLowerCase().includes(keyword);

                                                                                        const filteredCustomers = companyMatch
                                                                                            ? group.customers
                                                                                            : group.customers.filter(({ customer }) =>
                                                                                                customer.toLowerCase().includes(keyword)
                                                                                            );

                                                                                        if (filteredCustomers.length === 0) {
                                                                                            return null;
                                                                                        }

                                                                                        const companyCustomers =
                                                                                            filteredCustomers.map(c => c.customer);

                                                                                        const companyHidden =
                                                                                            companyCustomers.length > 0 &&
                                                                                            companyCustomers.every(customer =>
                                                                                                hiddenCustomers.includes(customer)
                                                                                            );

                                                                                        return (
                                                                                            <div key={group.company} className="mb-5">

                                                                                                {/* HEADER COMPANY */}
                                                                                                <div
                                                                                                    // onClick={() => toggleCompany(group.company)}
                                                                                                    className="
                                                                                                        flex justify-between items-center
                                                                                                        cursor-pointer
                                                                                                        bg-slate-100
                                                                                                        dark:bg-blue-950
                                                                                                        hover:bg-slate-200
                                                                                                        rounded
                                                                                                        px-2
                                                                                                        py-2
                                                                                                        font-semibold
                                                                                                        text-sm
                                                                                                    "
                                                                                                >
                                                                                                    {/* <i
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleCompanyVisibility(group.company);
                                                                                                        }}
                                                                                                        className={`cursor-pointer fa-regular ${
                                                                                                            companyHidden
                                                                                                                ? "fa-eye-slash text-gray-400"
                                                                                                                : "fa-eye text-green-600"
                                                                                                        }`}
                                                                                                    /> */}

                                                                                                    <span className="flex-1 min-w-0 truncate text-center" title={group.company}>
                                                                                                        {group.company}
                                                                                                    </span>

                                                                                                    {/* <i
                                                                                                        className={`fa-solid ${
                                                                                                            expandedCompanies[group.company]
                                                                                                                ? "fa-chevron-down"
                                                                                                                : "fa-chevron-right"
                                                                                                        }`}
                                                                                                    /> */}
                                                                                                </div>

                                                                                                {expandedCompanies[group.company] && (
                                                                                                    <div className="mt-2">

                                                                                                        {filteredCustomers.map(({ customer }, index) => (

                                                                                                            <div
                                                                                                                key={customer}
                                                                                                                onClick={() =>
                                                                                                                    handleDatasetMouseEnter(customer)
                                                                                                                }
                                                                                                                // onMouseLeave={handleDatasetMouseLeave}
                                                                                                                // onClick={() =>
                                                                                                                //     handleDatasetClick(customer)
                                                                                                                // }
                                                                                                                className="flex items-center gap-2 cursor-pointer hover:opacity-70 py-1 w-full"
                                                                                                            >
                                                                                                                <span className="w-5 text-right text-xs">
                                                                                                                    {index + 1}.
                                                                                                                </span>

                                                                                                                <span
                                                                                                                    className="w-3 h-3"
                                                                                                                    style={{
                                                                                                                        background:
                                                                                                                                                                                                                                                                                    customerColors[
                                                                                                                                                                                                                                                                                        customers.indexOf(customer) %
                                                                                                                                                                                                                                                                                        customerColors.length
                                                                                                                                                                                                                                                                                    ],
                                                                                                                        opacity:
                                                                                                                                                                                                                                                                                    hiddenCustomers.includes(customer)
                                                                                                                                                                                                                                                                                    ? 0.3
                                                                                                                                                                                                                                                                                    : 1
                                                                                                                    }}
                                                                                                                />

                                                                                                                <span title={customer}
                                                                                                                    className={`flex-1 break-words whitespace-normal text-xs ${
                                                                                                                        hiddenCustomers.includes(customer)
                                                                                                                                                                                                                                                                                ? "line-through opacity-50"
                                                                                                                                                                                                                                                                                : ""
                                                                                                                    }`}
                                                                                                                >
                                                                                                                    {customer.length > 29
                                                                                                                    ? customer.substring(0, 29) + "..."
                                                                                                                    : customer}
                                                                                                                </span>

                                                                                                            </div>

                                                                                                        ))}

                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : <div></div>}
                                                                </>
                                                            )
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        ):(
                                            <div className="flex items-center justify-center min-h-[300px] w-full">
                                                <p className="text-muted text-sm">Tidak ada transaksi</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-12 xl:col-span-4 min-h-0">
                                        <div className="p-6 card h-96 flex flex-col min-h-0">
                                            {topCategory.length > 0 ? (
                                                <div>
                                                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                                                        Sales by Category
                                                    </h2>

                                                    <div className="flex">
                                                        {/* DONUT CHART */}
                                                        <div className="flex-none w-[180px]">
                                                            <div ref={(el) => {
                                                                if (el) {
                                                                    chartRefCategory.current[company.id] = el;
                                                                }
                                                            }} />
                                                        </div>

                                                        {/* CUSTOM LEGEND */}
                                                        <div className="flex-1 flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-2">
                                                            {topCategory.map((item, index) => (
                                                                <div key={item.categ_id} className="flex items-center py-2 gap-3">
                                                                    {/* Dot */}
                                                                    <span
                                                                        className="w-2 rounded-full flex-none"
                                                                        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                                                    />

                                                                    {/* Label */}
                                                                    <span  title={item.categ_name} className="text-sm text-slate-700 dark:text-slate-200 w-28 truncate flex-none">
                                                                        {item.categ_name}
                                                                    </span>

                                                                    {/* Mini bar */}
                                                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-darkborder rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full"
                                                                            style={{
                                                                                width: `${Number(item.percentage)}%`,
                                                                                backgroundColor: categoryColors[index % categoryColors.length],
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Percentage */}
                                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 w-8 text-right flex-none">
                                                                        {Number(item.percentage)}%
                                                                    </span>

                                                                    {/* Amount */}
                                                                    <span className="text-sm whitespace-nowrap text-slate-500 dark:text-slate-400 w-24 text-right flex-none">
                                                                        {formatCurrency(item.total_amount)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ):(
                                                <div className="flex items-center justify-center min-h-[300px] w-full">
                                                    <p className="text-muted text-sm">Tidak ada transaksi</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-12 xl:col-span-3 min-h-0">
                                        <div className="p-6 card h-96 flex flex-col min-h-0">
                                            <div className="grid grid-cols-12">
                                                <h2 className="col-span-6 mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100 flex-none">
                                                    Top 10 Products
                                                </h2>
                                                <h2 
                                                    className="col-span-6 pt-1 pr-2 text-right mb-4 text-sm cursor-pointer capitalize text-blue-600 align-bottom hover:underline"
                                                    onClick={() => setShowAllProducts(prev => !prev)}
                                                >
                                                    {showAllProducts ? "Show Less" : "View All"}
                                                </h2>
                                            </div>

                                            {/* SCROLL AREA */}
                                            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {topProducts.map((product, index) => (
                                                        <div
                                                            key={index}
                                                        >
                                                            {/* Baris 1: Nama produk + Amount */}
                                                            <div className="flex items-start justify-between gap-4 leading-tight">
                                                                <p className="dark:text-white truncate text-sm leading-tight mb-1" title={product.product_name}>
                                                                    {index + 1}. {product.product_name?(product.product_name.length>29?`${product.product_name.slice(0, 29)}...`: product.product_name):''}
                                                                </p>
                                                                <p className="text-[15px] leading-tight font-medium flex-none mb-1">
                                                                    {formatCurrency(product.total_amount)}
                                                                </p>
                                                            </div>

                                                            {/* Baris 2: Progress bar + Qty, sejajar */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex-1 h-1 bg-black/10 dark:bg-darkborder rounded-2xl">
                                                                    <div
                                                                        className="bg-purple h-full rounded-2xl"
                                                                        style={{
                                                                            width: `${Number(product.percentage)}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="text-muted text-xs leading-tight flex-none">
                                                                    {product.total_qty} pcs
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 mt-2">
                                    <div class="col-span-12 xl:col-span-4 min-h-0">
                                        <div className="p-6 card h-96 flex flex-col min-h-0">

                                            <div className="grid grid-cols-12">
                                                <h2 className="col-span-6 mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100 flex-none">
                                                    Top 10 Customers
                                                </h2>
                                                <h2 
                                                    className="col-span-6 pt-1 pr-2 text-right mb-4 text-sm cursor-pointer capitalize text-blue-600 align-bottom hover:underline"
                                                    onClick={() => setShowAllCustomers(prev => !prev)}
                                                >
                                                    {showAllCustomers ? "Show Less" : "View All"}
                                                </h2>
                                            </div>

                                            {/* SCROLL AREA */}
                                            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {topCustomers.map((customer, index) => (
                                                        <div
                                                            key={customer.partner_id}
                                                            className="space-y-0"
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-4 leading-tight py-2">
                                                                        <div className="dark:text-white truncate text-sm">
                                                                            {index + 1}. {customer.customer_name.length > 29
                                                                                ? `${customer.customer_name.slice(0, 29)}...`
                                                                                : customer.customer_name}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 flex-none">
                                                                            <div className="text-[15px] leading-tight font-medium w-24 whitespace-nowrap">
                                                                                {formatCurrency(customer.total_amount)}
                                                                            </div>
                                                                            <div className="text-[15px] font-medium text-purple hover:underline cursor-pointer w-16 text-right" onClick={() =>{
                                                                                setShowInvoiceDataModal(true);
                                                                                setSelectedCustomer(customer.partner_id);
                                                                            }}>
                                                                                {customer.total_order} Orders
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Progress */}
                                                                    <div className="relative w-full h-1 bg-black/10 dark:bg-darkborder rounded-2xl">
                                                                        <div
                                                                            className="bg-purple h-full rounded-2xl"
                                                                            style={{
                                                                                width: `${Number(customer.percentage)}%`
                                                                            }}
                                                                        />
                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-12 xl:col-span-5 min-h-0">
                                        
                                        <div className="p-6 card h-full flex flex-col min-h-0">
                                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                                                Aging Analysis
                                            </h2>
                                            <div className="flex ml-5 mb-0 gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={showAllLabels2}
                                                    onChange={(e) => setShowAllLabels2(e.target.checked)}
                                                />
                                                <span>Show All Values</span>
                                            </div>
                                            <div ref={(el) => {
                                                if (el) {
                                                    chartRef6.current[company.id] = el;
                                                }
                                            }} />
                                        </div>
                                    </div>
                                    <div className="col-span-12 xl:col-span-3 min-h-0">
                                        <div className="p-6 card h-96 flex flex-col min-h-0">
                                            <div className="grid grid-cols-12">
                                                <h2 className="col-span-6 mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100 flex-none">
                                                    Top 10 Brands
                                                </h2>
                                                <h2 
                                                    className="col-span-6 pt-1 pr-2 text-right mb-4 text-sm cursor-pointer capitalize text-blue-600 align-bottom hover:underline"
                                                    onClick={() => setShowAllBrands(prev => !prev)}
                                                >
                                                    {showAllBrands ? "Show Less" : "View All"}
                                                </h2>
                                            </div>
                                            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {topBrands.map((brand, index) => (
                                                        <div
                                                            key={index}
                                                        >
                                                            {/* Baris 1: Nama produk + Amount */}
                                                            <div className="flex items-start justify-between gap-4 leading-tight">
                                                                <p className="dark:text-white truncate text-sm leading-tight mb-1">
                                                                    {index + 1}. {brand.brand_name?(brand.brand_name.length>29?`${brand.brand_name.slice(0, 29)}...`: brand.brand_name):''}
                                                                </p>
                                                                <p className="text-purple text-[15px] leading-tight font-medium flex-none mb-1">
                                                                    {formatCurrency(brand.total_amount)}
                                                                </p>
                                                            </div>

                                                            {/* Baris 2: Progress bar + Qty, sejajar */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex-1 h-1 bg-black/10 dark:bg-darkborder rounded-2xl">
                                                                    <div
                                                                        className="bg-purple h-full rounded-2xl"
                                                                        style={{
                                                                            width: `${Number(brand.percentage)}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="text-muted text-xs leading-tight flex-none">
                                                                    {brand.total_qty} pcs
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* SCROLL AREA */}
                                            
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {showStatsModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowStatsModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-lg mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                YTD Sales Trend — 2025 vs 2026
                            </h3>
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                    
                        <div className="text-slate-700 dark:text-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    checked={showAllLabelsYtd}
                                    onChange={(e) => setShowAllLabelsYtd(e.target.checked)}
                                />
                                <span className="text-sm">Show All Values</span>
                            </div>
                            <div ref={(el) => {
                                if (el) {
                                    chartRef7.current[selectedCompany] = el;
                                }
                            }} />
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showStatsOutstandingModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowStatsOutstandingModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-lg mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Payment Collection Trend
                            </h3>
                            <button
                                onClick={() => setShowStatsOutstandingModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                    
                        <div className="text-slate-700 dark:text-slate-200 relative">
                            <label className="absolute top-0 left-0 z-20 flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showAllLabelsPaymentCollectionTrend}
                                    onChange={(e) => setShowAllLabelsPaymentCollectionTrend(e.target.checked)}
                                />
                                <span className="text-sm">Show All Values</span>
                            </label>
                            <div ref={(el) => {
                                if (el) {
                                    chartRef8.current[selectedCompany] = el;
                                }
                            }} />
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setShowStatsOutstandingModal(false)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showInvoiceDataModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowInvoiceDataModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-7xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Invoice Data
                            </h3>
                            <button
                                onClick={() => setShowInvoiceDataModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table 
                                ref={(el) => {
                                    if (el) {
                                        invoiceTableRef.current[selectedCompany] = el;
                                    }
                                }}
                                className="w-full text-sm stripe hover" 
                                style={{ width: "100%" }}
                            >
                                <thead></thead>
                                <tbody></tbody>
                            </table>
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setShowInvoiceDataModal(false)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
    

}


const root = ReactDOM.createRoot(document.getElementById('sales_invoice'));


root.render(
    <SalesInvoicesCard />
);