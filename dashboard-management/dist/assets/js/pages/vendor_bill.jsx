const {useEffect,useState}=React;
function VendorBillCard(){
    const [vendorBill,setVendorBill]=useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/payment/vendor_bill`)
        .then(res=>setVendorBill(res.data.rows))
        .catch(err=>console.error(err));
    },[]);
    useEffect(()=>{
        if(vendorBill.length){

            setTimeout(()=>{

                // destroy jika sudah ada datatable
                if ($.fn.DataTable.isDataTable('#vendorTable')) {
                    $('#vendorTable').DataTable().destroy();
                }

                const table = $('#vendorTable').DataTable({
                    scrollX: true,
                    autoWidth: false
                });

                // fix jika resize / sidebar hide
                $(window).on('resize', function () {
                    table.columns.adjust();
                });

            },100);
        }
    },[vendorBill]);
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const formatCurrency = (value) => {
        if (value == null) return "-";
        return "Rp." + new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };
    const StatusBadge = ({ status }) => {
        const baseClass =
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

        switch (status) {
            case "In Payment":
                return (
                    <span className={`${baseClass} bg-green-500 text-white`}>
                        In Payment
                    </span>
                );
            case "Not Paid":
                return (
                    <span className={`${baseClass} bg-red-500 text-white`}>
                        Not Paid
                    </span>
                );
            case "Reversed":
                return (
                    <span className={`${baseClass} bg-yellow-400 text-black`}>
                        Reversed
                    </span>
                );
            case "reversed":
                return (
                    <span className={`${baseClass} bg-yellow-400 text-black`}>
                        Reversed
                    </span>
                );
            default:
                return (
                    <span className={`${baseClass} bg-gray-100 text-gray-700`}>
                        {status}
                    </span>
                );
        }
    };
    return(
        <div className="overflow-x-auto w-full">
            <table id="vendorTable" className="border min-w-max">
                <thead>
                    <tr>
                        <th>Number</th>
                        <th>Vendor</th>
                        <th>Bill Date</th>
                        <th>Due Date</th>
                        <th>Tax Number</th>
                        <th>Company</th>
                        <th>Tax Excluded</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {vendorBill.map((p, i) => (
                        <tr key={i}>
                            <td><strong>{p.bill_number}</strong></td>
                            <td>{p.vendor[1]?p.vendor[1]:'-'}</td>
                            <td>{formatDate(p.bill_date)}</td>
                            <td>{formatDate(p.due_date)}</td>
                            <td>{p.tax_number}</td>
                            <td>{p.company[1]?p.company[1]:'-'}</td>
                            <td>{formatCurrency(p.tax_excluded)}</td>
                            <td>{formatCurrency(p.total)}</td>
                            <td align="center"><StatusBadge status={p.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
const root = ReactDOM.createRoot(
    document.getElementById("vendorBillTable")
);
root.render(<VendorBillCard />);