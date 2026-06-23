const { useEffect, useState, useRef } = React;

function ResidualAgingCard() {
    const [residualAging, setResidualAging] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Fetch data
    useEffect(() => {
        axios
            .get(`${__API_URL__}/journal_item/residual_aging`)
            .then(res => setResidualAging(res.data))
            .catch(err => console.error(err));
    }, []);

    // Render / update chart
    useEffect(() => {
        if (!residualAging.length) return;

        const categories = residualAging.map(item => item.aging_bucket);
        const seriesData = residualAging.map(item => Number(item.residual_total));

        var options = {
            series: [
                {
                    name: "PRODUCT A",
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

        chartInstance.current = new ApexCharts(chartRef.current, options);
        chartInstance.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    });

    return (
        <div ref={chartRef}></div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("apex_area12")
);
root.render(<ResidualAgingCard />);
