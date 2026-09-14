// Hook besar yang menampung SEMUA logic yang identik antara
// sales_order_card.jsx dan invoice_card.jsx: date filter, company tabs,
// fetch stats utama + company revenue/top category/products/customers/brands,
// derive data untuk CustomerLegend, dan wiring highlight legend.
//
// Yang TIDAK masuk sini (tetap di masing-masing file halaman) karena
// memang berbeda per halaman:
// - KPI cards (reportYtd/totalOrder + activeCustomer/invoicePercentage
//   di sales, atau companyResidual/companyPaid di invoices)
// - Panel tengah row kedua (Order Fulfillment di sales, Aging Analysis
//   di invoices)
// - Seluruh JSX/layout render
//
// endpoints = {
//   companies:      '/sales/companies'        atau '/invoices/companies'
//   stats:          '/sales/get_sales_stats'  atau '/invoices/invoice_stats'
//   companyRevenue: '/sales/company_revenue'  atau '/invoices/company_revenue'
//   topCategory:    '/sales/top_category'     atau '/invoices/top_category'
//   topProducts:    '/sales/top_products'     atau '/invoices/top_products'
//   topCustomers:   '/sales/get_top_customers' atau '/invoices/top_customers'
//   topBrands:      '/sales/top_brands'       atau '/invoices/top_brands'
// }
window.useDashboardCore = function useDashboardCore(endpoints) {
    const { useEffect, useState, useRef } = React;

    //Date Filter Variable
    const [isOpen, setIsOpen] = useState(false);
    const [filterLabel, setFilterLabel] = useState("This Month");
    const [selectedRadio, setSelectedRadio] = useState("this month");
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [defaultDates, setDefaultDates] = useState(null);
    const [filterType, setFilterType] = useState("date");
    const [monthDates, setMonthDates] = useState(null);
    const [yearDates, setYearDates] = useState(null);

    //Company filter Variable
    const [companies, setCompanies] = useState([]);
    const contentRef = useRef(null);
    const [selectedCompany, setSelectedCompany] = useState("");
    const scrollTimeoutRef = useRef(null);

    //Sales/Invoice Trend Chart Variable
    const [salesStats, setSalesStats] = useState([]);
    const [selectedFilterBy, setSelectedFilterBy] = useState("company");
    const [showAllLabels, setShowAllLabels] = useState(false);

    //Chart legend Variable
    const [hiddenCustomers, setHiddenCustomers] = useState([]);
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const customerColors = [
        '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
        '#546E7A', '#26A69A', '#D10CE8', '#FF9800', '#4CAF50'
    ];

    //Company Revenue Variable
    const [companyRevenue, setCompanyRevenue] = useState([]);

    //Top Category Variable
    const [topCategory, setTopCategory] = useState([]);

    //Top 10 Products Variable
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [topProducts, setTopProducts] = useState([]);

    //Top 10 Customers Variable
    const [showAllCustomers, setShowAllCustomers] = useState(false);
    const [topCustomers, setTopCustomers] = useState([]);

    //Top 10 Brands Variable
    const [topBrands, setTopBrands] = useState([]);

    //Loading Variable
    const [isLoadingSalesStats, setIsLoadingSalesStats] = useState(false);
    const [isLoadingCompanyRevenue, setIsLoadingCompanyRevenue] = useState(false);
    const [isLoadingTopCategory, setIsLoadingTopCategory] = useState(false);
    const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(false);
    const [isLoadingTopCustomers, setIsLoadingTopCustomers] = useState(false);
    const [isLoadingTopBrands, setIsLoadingTopBrands] = useState(false);

    // =========================================================
    // DATE FILTER HANDLERS
    // =========================================================
    useEffect(() => {
        setDefaultDates([dayjs().startOf('month'), dayjs()]);
    }, []);

    const handleRadioChange = (value) => {
        if (value === "today") {
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs(), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(`${dayjs().format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`);
            setIsOpen(false);
        } else if (value === "yesterday") {
            setStartDate(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
            setEndDate(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
            setDefaultDates([dayjs().subtract(1, "day"), dayjs().subtract(1, "day")]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(`${dayjs().subtract(1, "day").format("DD MMM YYYY")} - ${dayjs().subtract(1, "day").format("DD MMM YYYY")}`);
            setIsOpen(false);
        } else if (value === "last 7 days") {
            setStartDate(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs().subtract(7, "day"), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(`${dayjs().subtract(7, "day").format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`);
            setIsOpen(false);
        } else if (value === "this week") {
            setStartDate(dayjs().startOf('isoWeek').format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs().startOf('isoWeek'), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(`${dayjs().startOf('isoWeek').format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`);
            setIsOpen(false);
        } else if (value === "this month") {
            setStartDate(dayjs().startOf('month').format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setDefaultDates([dayjs().startOf('month'), dayjs()]);
            setFilterType("date");
            setMonthDates(null);
            setYearDates(null);
            setFilterLabel(`${dayjs().startOf('month').format("DD MMM YYYY")} - ${dayjs().format("DD MMM YYYY")}`);
            setIsOpen(false);
        } else if (value === "this year") {
            setStartDate(dayjs().startOf('year').format("YYYY-MM"));
            setEndDate(dayjs().format("YYYY-MM"));
            setMonthDates([dayjs().startOf('year'), dayjs()]);
            setDefaultDates(null);
            setYearDates(null);
            setFilterType("month");
            setFilterLabel(`${dayjs().startOf('year').format("MMM YYYY")} - ${dayjs().format("MMM YYYY")}`);
            setIsOpen(false);
        } else if (value === "custom") {
            setIsOpen(true);
        }
    };

    const onRangeChange = (dates, dateStrings) => {
        if (dates) {
            setDefaultDates(dates);
            setMonthDates(null);
            setYearDates(null);
            setStartDate(dateStrings[0]);
            setEndDate(dateStrings[1]);
            setFilterType("date");
            setFilterLabel(`${dayjs(dateStrings[0]).format("DD MMM YYYY")} - ${dayjs(dateStrings[1]).format("DD MMM YYYY")}`);
        } else {
            setDefaultDates([dayjs(), dayjs()]);
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setFilterLabel("Today");
            setFilterType("date");
        }
    };

    const onMonthRangeChange = (date, dateString) => {
        if (date) {
            setDefaultDates(null);
            setMonthDates(date);
            setYearDates(null);
            setStartDate(dateString[0]);
            setEndDate(dateString[1]);
            setFilterType("month");
            setFilterLabel(`${dayjs(dateString[0] + "-01").format("MMM YYYY")} - ${dayjs(dateString[1] + "-01").format("MMM YYYY")}`);
        } else {
            setDefaultDates([dayjs(), dayjs()]);
            setStartDate(dayjs().format("YYYY-MM-DD"));
            setEndDate(dayjs().format("YYYY-MM-DD"));
            setFilterLabel("Today");
            setFilterType("date");
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
            setFilterType("date");
        }
    };

    // =========================================================
    // FETCH COMPANIES
    // =========================================================
    useEffect(() => {
        const params = {};
        if (startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        axios.get(`${__API_URL__}${endpoints.companies}`, { params })
            .then(res => {
                const companyList = res.data.map(item => ({
                    id: item.company_id[0],
                    name: item.company_id[1]
                }));
                setCompanies(companyList);
                if (companyList.length > 0) {
                    setSelectedCompany(prev => {
                        const exists = companyList.some(company => company.id === prev);
                        if (exists) return prev;
                        return companyList[0].id;
                    });
                } else {
                    setSelectedCompany("");
                }
            })
            .catch(console.error);
    }, [startDate, endDate]);

    // =========================================================
    // COMPANY TAB HANDLERS
    // =========================================================
    const handleCompanyClick = (companyId) => {
        const index = companies.findIndex(company => company.id === companyId);
        if (index === -1) return;

        setSelectedCompany(prev => {
            if (prev === companyId) return prev;
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

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const index = Math.round(container.scrollLeft / container.clientWidth);
            const company = companies[index];
            if (!company) return;

            setSelectedCompany(prev => {
                if (prev === company.id) return prev;
                return company.id;
            });
        }, 150);
    };

    // Sinkronisasi selectedFilterBy mengikuti selectedCompany
    useEffect(() => {
        if (selectedCompany === '') {
            setSelectedFilterBy('company');
        } else {
            setSelectedFilterBy('company_list');
        }
    }, [selectedCompany]);

    // =========================================================
    // FETCH STATS UTAMA (sales stats / invoice stats)
    // =========================================================
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

        setIsLoadingSalesStats(true);
        axios.get(`${__API_URL__}${endpoints.stats}`, {
            params,
            signal: controller.signal
        })
            .then(res => {
                setSalesStats(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
                    return;
                }
                console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoadingSalesStats(false);
                }
            });

        return () => {
            controller.abort();
        };
    }, [startDate, endDate, filterType, selectedCompany, selectedFilterBy]);

    // =========================================================
    // FETCH COMPANY REVENUE
    // =========================================================
    useEffect(() => {
        const controller = new AbortController();
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        setIsLoadingCompanyRevenue(true);
        axios.get(`${__API_URL__}${endpoints.companyRevenue}`, { params, signal: controller.signal })
            .then(res => {
                setCompanyRevenue(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingCompanyRevenue(false);
            });
        return () => controller.abort();
    }, [startDate, endDate, filterType]);

    // =========================================================
    // FETCH TOP CATEGORY
    // =========================================================
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
        setIsLoadingTopCategory(true);
        axios.get(`${__API_URL__}${endpoints.topCategory}`, { params, signal: controller.signal })
            .then(res => {
                setTopCategory(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingTopCategory(false);
            });
        return () => controller.abort();
    }, [startDate, endDate, filterType, selectedCompany]);

    // =========================================================
    // FETCH TOP 10 PRODUCTS
    // =========================================================
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
        if (showAllProducts) {
            params.show_all = "true";
        }
        setIsLoadingTopProducts(true);
        axios.get(`${__API_URL__}${endpoints.topProducts}`, { params, signal: controller.signal })
            .then(res => {
                setTopProducts(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingTopProducts(false);
            });
        return () => controller.abort();
    }, [startDate, endDate, filterType, selectedCompany, showAllProducts]);

    // =========================================================
    // FETCH TOP 10 CUSTOMERS
    // =========================================================
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
        if (showAllCustomers) {
            params.show_all = "true";
        }
        setIsLoadingTopCustomers(true);
        axios.get(`${__API_URL__}${endpoints.topCustomers}`, { params, signal: controller.signal })
            .then(res => {
                setTopCustomers(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingTopCustomers(false);
            });
        return () => controller.abort();
    }, [startDate, endDate, filterType, selectedCompany, showAllCustomers]);

    // =========================================================
    // FETCH TOP 10 BRANDS
    // =========================================================
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
        setIsLoadingTopBrands(true);
        axios.get(`${__API_URL__}${endpoints.topBrands}`, { params, signal: controller.signal })
            .then(res => {
                setTopBrands(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingTopBrands(false);
            });
        return () => controller.abort();
    }, [startDate, endDate, filterType, selectedCompany]);

    // =========================================================
    // DERIVE companyGroups / customers / visibleCustomers
    // (dipakai oleh SalesTrendChart & CustomerLegend)
    // =========================================================
    const companyGroups = React.useMemo(() => {
        const groups = {};

        salesStats.forEach(item => {
            const company = item.company;
            const customer = item.label;
            const amount = Number(item.total_amount);

            if (!groups[company]) {
                groups[company] = {};
            }
            groups[company][customer] = (groups[company][customer] || 0) + amount;
        });

        return Object.entries(groups)
            .map(([company, customers]) => ({
                company,
                customers: Object.entries(customers)
                    .sort((a, b) => b[1] - a[1])
                    // "key" = identitas unik per (company, customer) — label
                    // yang sama (mis. "No Brand") bisa muncul di lebih dari
                    // satu company, jadi tidak bisa diandalkan sebagai
                    // identitas sendirian (lihat window.buildCustomerKey)
                    .map(([customer, total]) => ({
                        customer,
                        total,
                        key: window.buildCustomerKey(company, customer),
                    }))
            }))
            .sort((a, b) => {
                const totalA = a.customers.reduce((s, x) => s + x.total, 0);
                const totalB = b.customers.reduce((s, x) => s + x.total, 0);
                return totalB - totalA;
            });
    }, [salesStats]);

    useEffect(() => {
        const expanded = {};
        companyGroups.forEach(group => {
            expanded[group.company] = true;
        });
        setExpandedCompanies(expanded);
    }, [companyGroups]);

    // "customers" di sini berisi KEY (company+label) bukan label polos —
    // lihat window.buildCustomerKey. CustomerLegend tetap menampilkan
    // label bersih (dari group.customers[].customer), key ini cuma
    // dipakai untuk identitas (warna, seleksi highlight, visibility).
    const customers = React.useMemo(() => {
        return companyGroups.flatMap(group => group.customers.map(c => c.key));
    }, [companyGroups]);

    useEffect(() => {
        setHiddenCustomers([]);
    }, [customers]);

    const visibleCustomers = React.useMemo(() => {
        return customers.filter(customer => !hiddenCustomers.includes(customer));
    }, [customers, hiddenCustomers]);

    const isSingleDate = [...new Set(salesStats.map(item => item.write_date))].length === 1;

    // highlight garis chart saat item CustomerLegend diklik
    const legendListRef = useRef(null);
    const { selectedDatasets, handleDatasetClick } = window.useDatasetHighlight(legendListRef);

    const { totalSales } = React.useMemo(() => {
        return {
            totalSales: salesStats.reduce(
                (sum, item) => sum + Number(item.total_amount || 0),
                0
            ),
        };
    }, [salesStats]);

    return {
        // date filter
        isOpen, setIsOpen, filterLabel, selectedRadio, setSelectedRadio,
        startDate, endDate, defaultDates, filterType, monthDates, yearDates,
        handleRadioChange, onRangeChange, onMonthRangeChange, onYearRangeChange,
        // company tabs
        companies, contentRef, selectedCompany, handleCompanyClick, handleContentScroll,
        // filter by / stats utama
        selectedFilterBy, setSelectedFilterBy, salesStats, isLoadingSalesStats,
        showAllLabels, setShowAllLabels,
        // panel-panel yang identik di kedua halaman
        companyRevenue, isLoadingCompanyRevenue,
        topCategory, isLoadingTopCategory,
        topProducts, isLoadingTopProducts, showAllProducts, setShowAllProducts,
        topCustomers, isLoadingTopCustomers, showAllCustomers, setShowAllCustomers,
        topBrands, isLoadingTopBrands,
        // customer legend derive
        companyGroups, customers, hiddenCustomers, expandedCompanies, customerColors,
        visibleCustomers, isSingleDate,
        // highlight
        legendListRef, selectedDatasets, handleDatasetClick,
        // total
        totalSales,
    };
};
