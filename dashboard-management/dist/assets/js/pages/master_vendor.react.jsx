const { useEffect, useRef, useState } = React;

function VendorTable() {
    const tableRef = useRef(null);
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        axios.get(`${__API_URL__}/vendor/master`)
            .then(res => setVendors(res.data))
            .catch(err => console.error(err));
    }, []); 

    useEffect(() => {
        if (!vendors.length) return;

        // Destroy jika sudah ada
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        $(tableRef.current).DataTable({
            data: vendors.map(p => [
                p.city,
                (p.country_id && p.country_id[1]) ? p.country_id[1] : "-",
                p.email,
                p.name,
                p.phone,
                p.total_invoiced
            ]),
            scrollX: true,              // 🔥 PENTING
            autoWidth: false,
            columns: [
                { title: "City" },
                { title: "Country" },
                { title: "Email" },
                { title: "Name" },
                { title: "Phone" },
                { title: "Total Sales" },
            ]
        });
    }, [vendors]);

    return (
        <table
            ref={tableRef}
            className="min-w-[640px] w-full"
        />
    );
}

// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("vendorTableRoot")
);
root.render(<VendorTable />);
