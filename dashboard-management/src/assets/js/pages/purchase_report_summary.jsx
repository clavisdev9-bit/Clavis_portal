const {useEffect,useState,useRef}=React;
function PurchaseReportCard(){
    console.log('tes');
    const [totalPurchase,setTotalPurchase]=useState([]);
    const [totalAmount,setTotalAmount]=useState([]);
    const [totalTax,setTotalTax]=useState([]);
    const [numberOfItem,setNumberOfItem]=useState([]);
    const [purchaseToInvoice,setPurchaseToInvoice]=useState([]);
    const [montlyChart,setMonthlyChart]=useState([]);
    const [topSupplier,setTopSupplier]=useState([]);
    const [salesPerson,setSalesPerson]=useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    const chartRef3 = useRef(null);
    const chartInstance3 = useRef(null);
    useEffect(()=>{
        axios.get(`${__API_URL__}/purchase/total_purchase`)
        .then(res=>setTotalPurchase(res.data[0].total_purchase))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/total_amount`)
        .then(res=>setTotalAmount(res.data[0].total_amount))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/total_tax`)
        .then(res=>setTotalTax(res.data[0].total_tax))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/number_of_item`)
        .then(res=>setNumberOfItem(res.data[0].total_item_count))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/purchase_invoice`)
        .then(res=>setPurchaseToInvoice(res.data[0].purchase_to_invoice))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/purchase_trend`)
        .then(res=>setMonthlyChart(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/top_supplier`)
        .then(res=>setTopSupplier(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/purchase/sales_person`)
        .then(res=>setSalesPerson(res.data))
        .catch(err=>console.error(err));
    },[]);
    useEffect(() => {
        if (!montlyChart.length) return;

        const categories = montlyChart.map(item => item.month_year);
        const seriesData = montlyChart.map(item => item.monthly_purchase);

        const options = {
            chart: {
                height: 300,
                type: "area",
                fontFamily: "Inter, sans-serif",
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            series: [
                {
                    name: "Amount Total",
                    data: seriesData,
                },
            ],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 3,
                curve: "straight",
                lineCap: "butt",
            },
            dropShadow: {
                enabled: true,
                opacity: 0.8,
                blur: 10,
                left: -7,
                top: 22,
            },
            colors: ["#0ea5e9"],
            markers: {
                size: 0, // ⬅️ point jelas di setiap data
                strokeWidth: 1,
                strokeColors: "#000000ff",
                hover: {
                    size: 1,
                },
            },
            labels: categories,
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                crosshairs: {
                    show: true,
                },
                labels: {
                    offsetX: 0,
                    offsetY: 5,
                    style: {
                        fontSize: "12px",
                        cssClass: "apexcharts-xaxis-title",
                    },
                },
                lines: {
                    show: true,    // ⬅️ aktifkan garis horizontal
                },
            },
            yaxis: {
                tickAmount: 5,
                labels: {
                    offsetX: -10,
                    offsetY: 0,
                    style: {
                        fontSize: "12px",
                        cssClass: "apexcharts-yaxis-title",
                    },
                    formatter: function (value) {
                        return (value / 1000000).toFixed(0) + " jt";
                    }
                },
                opposite: false,
                lines: {
                    show: true,    // ⬅️ aktifkan garis vertikal
                },
            },
            grid: {
                show: true,
                borderColor: "#e5e7eb", // warna grid
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
                yaxis: {
                    lines: {
                        show: true,
                    },
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            legend: {
                show: false,
            },
            tooltip: {
                marker: {
                    show: true,
                },
                x: {
                    show: false,
                },
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: 0,
                    opacityTo: 0,
                    stops: [100, 100],
                },
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new ApexCharts(chartRef.current, options);
        chartInstance.current.render();
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    }, [montlyChart]);
    useEffect(() => {
        if (!topSupplier.length) return;

        const categories = topSupplier.map(item => item.partner_id);
        const seriesData = topSupplier.map(item => Number(item.total_purchase));

        var options = {
            series: [
                {
                    name: "Amount Total",
                    data: seriesData,
                },
            ],
            chart: {
                type: "bar",
                height: 300,
                stacked: true,
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            colors: ["#22c55e", "#ef4444", "#0ea5e9"],

            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 10,
                    columnWidth: "25%",
                },
            },
            xaxis: {
                categories: categories,
                labels: {
                    style: {
                        fontSize: "11px",
                        cssClass: "apexcharts-yaxis-title",
                    },
                },
            },
            yaxis: {
                tickAmount: 5,
                labels: {
                    offsetX: -10,
                    offsetY: 0,
                    style: {
                        fontSize: "12px",
                        cssClass: "apexcharts-yaxis-title",
                    },
                    formatter: function (value) {
                        return (value / 1000000).toFixed(0) + " jt";
                    }
                },
                opposite: false,
                lines: {
                    show: true,    // ⬅️ aktifkan garis vertikal
                },
            },
            legend: {
                show: false,
            },
            fill: {
                opacity: 1,
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartRef2.current, options);
        chartInstance2.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    },[topSupplier]);
    useEffect(() => {
        if (!salesPerson.length) return;

        const categories = salesPerson.map(item => item.create_uid);
        const totalAmount = salesPerson.reduce(
            (sum, item) => sum + Number(item.total_purchase),
            0
        );

        const seriesData = salesPerson.map(item => {
            const value = Number(item.total_purchase);
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
            colors: ["#0ea5e9", "#22c55e", "#ef4444", "#94989a"],
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
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance3.current) {
            chartInstance3.current.destroy();
        }

        chartInstance3.current = new ApexCharts(chartRef3.current, basicbonut);
        chartInstance3.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance3.current) {
                chartInstance3.current.destroy();
            }
        };
    },[salesPerson]);
    const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value));

    const formatCurrency = (value) => {
        if (value == null) return "-";
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value).replace(/^/, "Rp. ");
    };
    return(
        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">

                {/* ===== REVENUE ===== */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="shopping-bag"></i>
                        Total Purchase
                    </p>
                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatNumber(totalPurchase)}
                    </h4>
                </div>

                {/* ===== EXPENSE ===== */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i class="fa-solid fa-dollar-sign"></i>
                        Total Amount
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(totalAmount)}
                    </h4>
                </div>

                {/* ===== NET PROFIT ===== */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i class="fa-solid fa-money-bill"></i>
                        Total Tax
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(totalTax)}
                    </h4>
                </div>
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i class="fa-solid fa-briefcase"></i>
                        Number Of Item
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatNumber(numberOfItem)}
                    </h4>
                </div>
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i class="fa-solid fa-edit"></i>
                        Purchase To Invoice
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatNumber(purchaseToInvoice)}
                    </h4>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
                <div class="card rounded-xs shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">Monthly Chart</h3>
                    <p class="text-sm">
                        <div ref={chartRef}></div>
                    </p>
                </div>

                <div class="card rounded-xs shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">Top Suppliers</h3>
                    <p class="text-sm">
                        <div ref={chartRef2}></div>
                    </p>
                </div>

                <div class="card rounded-xs shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">Sales by Salesperson</h3>
                    <p class="text-sm">
                        <div ref={chartRef3}/>
                    </p>
                </div>

            </div>
        </div>
    )
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("purchase_report_summary")
);
root.render(<PurchaseReportCard />);
