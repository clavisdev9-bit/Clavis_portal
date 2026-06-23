const { useEffect, useState, useRef } = React;

function AccountMoveCard() {
    const [agingBucket, setAgingBucket] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Fetch data
    useEffect(() => {
        axios
            .get(`${__API_URL__}/account_moves/get_aging_bucket`)
            .then(res => setAgingBucket(res.data))
            .catch(err => console.error(err));
    }, []);

    // Render / update chart
    useEffect(() => {
        if (!agingBucket.length) return;

        const categories = agingBucket.map(item => item.bucket);
        const seriesData = agingBucket.map(item => Number(item.ar_total));

        var barchart = {
            series: [
                {
                    name: "AR Total",
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
            colors: ["#0ea5e9", "#ef4444", "#0ea5e9"],

            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 10,
                    columnWidth: "25%",
                },
            },
            xaxis: {
                categories: categories,
            },
            legend: {
                show: false,
            },
            fill: {
                opacity: 1,
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new ApexCharts(chartRef.current, barchart);
        chartInstance.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [agingBucket]);

    return (
        <div ref={chartRef} id="barchart2"></div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("barchart2")
);
root.render(<AccountMoveCard />);
