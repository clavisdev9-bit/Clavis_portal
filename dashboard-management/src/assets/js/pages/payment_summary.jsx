const {useEffect,useState}=React;
function PaymentCard(){
    const [totalPayment,setTotalPayment]=useState([]);
    const [uniqueCustomer,setUniqueCustomer]=useState([]);
    const [averagePayment,setAveragePayment]=useState([]);
    const [customerPayment,setCustomerPayment]=useState([]);
    const [topCustomer,setTopCustomer]=useState([]);
    const [methodDistribution,setMethodDistribution]=useState([]);
    const [recentPayment,setRecentPayment]=useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const chartTopCustomerRef = useRef(null);
    const chartInstance2 = useRef(null);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/total_payment`)
        .then(res=>setTotalPayment(res.data.rows[0].total_payments))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/unique_customer`)
        .then(res=>setUniqueCustomer(res.data.rows[0].unique_customers))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/average_payment`)
        .then(res=>setAveragePayment(res.data.rows[0].average_payment))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/customer_payment`)
        .then(res=>setCustomerPayment(res.data.rows))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/top_customer`)
        .then(res=>setTopCustomer(res.data.rows))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/method_distribution`)
        .then(res=>setMethodDistribution(res.data.rows))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/recent_payment`)
        .then(res=>setRecentPayment(res.data.rows))
        .catch(err=>console.error(err));
    },[]);
    
    
    useEffect(() => {
        if (!customerPayment.length) return;

        const categories = billingTrend.map(item => item.month);
        const seriesData = billingTrend.map(item => item.total_payments);

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
                    name: "Current Week",
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
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [customerPayment]);

    
    useEffect(() => {
        if (!topCustomer.length) return;

        const categories = topCustomer.map(item => item.customer[1]);
        const seriesData = topCustomer.map(item => item.total_paid);

        var simplebarchart = {
            series: [
                {
                    name: "Sales",
                    data: seriesData,
                },
            ],
            chart: {
                height: 300,
                type: "bar",
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 1,
            },
            colors: ["#0ea5e9"],
            xaxis: {
                categories: categories,
                axisBorder: {
                    color: "#e0e6ed",
                },
            },
            yaxis: {
                opposite: false,
                reversed: false,
            },
            grid: {
                borderColor: "#e8e8e8",
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                },
            },
            fill: {
                opacity: 0.8,
            },
        };
        var chart = new ApexCharts(
            document.querySelector("#simplebarchart"),
            simplebarchart
        );

        // Destroy chart lama jika ada
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartTopCustomerRef.current, simplebarchart);
        chartInstance2.current.render();
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    }, [topCustomer]);
    useEffect(() => {
        if (!methodDistribution.length) return;
        const totalTransactions = methodDistribution.reduce(
            (sum, item) => sum + Number(item.transactions),
            0
        );
        const categories = methodDistribution.map(item => item.payment_method_line_id[1]);
        const seriesData = methodDistribution.map(item => (item.transactions/totalTransactions)*100);
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
        var chart = new ApexCharts(document.querySelector("#basicbonut"), basicbonut);
        chart.render();
    }, [methodDistribution]);

    const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value));

    const formatCurrency = (value) => {
        if (value == null) return "-";
        return "$" + new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    return(
        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4">

                {/* ===== REVENUE ===== */}
                <div className="card">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Customer Payment</h2>
                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {totalPayment}
                    </h4>
                </div>

                {/* ===== EXPENSE ===== */}
                <div className="card">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Unique Customers</h2>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {uniqueCustomer}
                    </h4>
                </div>

                {/* ===== NET PROFIT ===== */}
                <div className="card">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Average Payment</h2>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {averagePayment}
                    </h4>
                </div>
                <div className="card">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Month-over-Month Growth</h2>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    </h4>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-3">
                <div class="col-span-2 p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Customer Payments by month</h2>
                    <div ref={chartRef}></div>
                </div>
                <div class="p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Top Customers</h2>
                    <div ref={chartTopCustomerRef}></div>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-3">
                <div class="p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Payment Methods</h2>
                    <div id="basicbonut"></div>
                </div>
                <div class="col-span-2 p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Recent Payments</h2>
                    <table className="border">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPayment.map((p, i) => (
                                <tr key={i}>
                                    <td>{formatDate(p.date)}</td>
                                    <td>{p.partner_id[1]?p.partner_id[1]:'-'}</td>
                                    <td>{formatCurrency(p.amount_signed)}</td>
                                    <td>{p.state}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
    )
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("payment_summary")
);
root.render(<PaymentCard />);
