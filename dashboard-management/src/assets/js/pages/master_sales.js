document.addEventListener("DOMContentLoaded", () => {
    loadSales();
    loadTotalSales();
});
function loadTotalSales() {
    fetch(`${__API_URL__}/sales/total_sales`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('total_sales').innerHTML=formatDollar(data[0].total_amount);
        })
        .catch(err => console.error("API Error:", err));
}
            
function loadSales() {
    let company = localStorage.getItem("company");
    fetch(`${__API_URL__}/sales/master?company=${company}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if ($.fn.DataTable.isDataTable('#salesTable')) {
                $('#salesTable').DataTable().clear().destroy();
            }
            // siapkan array untuk DataTables
            const tableData = data.map(sales => {
                return [
                    formatDollar(sales.amount_total),
                    sales.display_name,
                    sales.name,
                    sales.partner_invoice_id[1],
                    sales.type_name,
                    formatDate(sales.write_date),
                    sales.write_uid[1],
                    sales.company_id[1]
                ];
            });

            // Inisialisasi DataTable
            $("#salesTable").DataTable({
                data: tableData,
                columns: [
                    { title: "Total" },
                    { title: "Number" },
                    { title: "Number" },
                    { title: "Customers" },
                    { title: "Status" },
                    { title: "Creation Date" },
                    { title: "Sales Person" },
                    { title: "Company" },
                ]
            });
            $('#salesTable').DataTable();

        })
        .catch(err => console.error("API Error:", err));
        
}
const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);

    const pad = n => n.toString().padStart(2, "0");

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    const second = pad(d.getSeconds());

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
};
const formatDollar = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(value);
};

const socketeu = new WebSocket("ws://localhost:3000");

socketeu.onmessage = (msg) => {
    if (msg.data === "updated") {
        loadSales();
    }
};
loadSales();