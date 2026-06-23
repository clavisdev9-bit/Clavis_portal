const { useEffect, useRef, useState } = React;

function AccountMoveTable() {
    const tableRef = useRef(null);
    const [account_moves, setAccountMoves] = useState([]);

    useEffect(() => {
        axios.get(`${__API_URL__}/account_moves/master`)
            .then(res => setAccountMoves(res.data))
            .catch(err => console.error(err));
    }, []); 
    console.log(account_moves);
    useEffect(() => {
        if (!account_moves.length) return;

        // Destroy jika sudah ada
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        $(tableRef.current).DataTable({
            data: account_moves.map(p => [
                p.city,
                (p.country_id && p.country_id[1]) ? p.country_id[1] : "-",
                p.email,
                p.name,
                p.phone,
                p.total_invoiced
            ]),
            columns: [
                { title: "City" },
                { title: "Country" },
                { title: "Email" },
                { title: "Name" },
                { title: "Phone" },
                { title: "Total Sales" },
            ]
        });
    }, [account_moves]);

    return (
        <table
            ref={tableRef}
            className="min-w-[640px] w-full"
        />
    );
}

// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("accountMoveTableRoot")
);
root.render(<AccountMoveTable />);
