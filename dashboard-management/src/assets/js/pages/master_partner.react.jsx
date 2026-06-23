const { useEffect, useRef, useState } = React;

function PartnerTable() {
    const tableRef = useRef(null);
    const [partners, setPartners] = useState([]);

    useEffect(() => {
        axios.get(`${__API_URL__}/partner/master`)
            .then(res => setPartners(res.data))
            .catch(err => console.error(err));
    }, []); 

    useEffect(() => {
        if (!partners.length) return;

        // Destroy jika sudah ada
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        $(tableRef.current).DataTable({
            data: partners.map(p => [
                (p.country_id && p.country_id[1]) ? p.country_id[1] : "-",
                p.email,
                p.name,
                p.phone!=='false' ? p.phone : "-",
                p.city
            ]),
            scrollX: true,              // 🔥 PENTING
            autoWidth: false,
            columns: [
                { title: "Country" },
                { title: "Email" },
                { title: "Name" },
                { title: "Phone" },
                { title: "City" },
            ]
        });
    }, [partners]);

    return (
        <table
            ref={tableRef}
            className="min-w-[640px] w-full"
        />
    );
}

// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("partnerTableRoot")
);
root.render(<PartnerTable />);
