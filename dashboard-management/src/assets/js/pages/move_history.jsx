const { useEffect, useState, useRef } = React;

function MoveHistoryCard() {
    const [moveHistory, setMoveHistory] = useState([]);
    const tableRef = useRef(null);

    useEffect(() => {
        axios.get(`${__API_URL__}/move_history/master`)
            .then(res => setMoveHistory(res.data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!moveHistory.length) return;

        const tableId = '#moveHistoryTable';

        // destroy jika sudah ada
        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().clear().destroy();
        }

        const table = $(tableRef.current).DataTable({
            scrollX: true,
            autoWidth: false
        });

        const handleResize = () => table.columns.adjust();
        $(window).on('resize', handleResize);

        return () => {
            $(window).off('resize', handleResize);
            table.destroy();
        };

    }, [moveHistory]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    };

    const StatusBadge = ({ status }) => {
        const baseClass = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

        switch (status) {
            case "done": return <span className={`${baseClass} bg-green-500 text-white`}>Done</span>;
            case "waiting": return <span className={`${baseClass} bg-gray-400 text-white`}>Waiting</span>;
            case "draft": return <span className={`${baseClass} bg-yellow-400 text-black`}>Draft</span>;
            case "assigned": return <span className={`${baseClass} bg-red-100 text-black`}>Assigned</span>;
            case "confirmed": return <span className={`${baseClass} bg-yellow-400 text-black`}>Confirmed</span>;
            case "cancel": return <span className={`${baseClass} bg-red-500 text-white`}>Cancelled</span>;
            default: return <span className={`${baseClass} bg-gray-100 text-gray-700`}>{status}</span>;
        }
    };

    return (
        <div className="col-span-12 card">
            <div className="overflow-x-auto w-full">
                <table id="moveHistoryTable" ref={tableRef} className="display border min-w-max">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Reference</th>
                            <th>Product</th>
                            <th>Lot/serial</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {moveHistory.map((p, i) => (
                            <tr key={i}>
                                <td>{formatDate(p.date)}</td>
                                <td>{p.name}</td>
                                <td>{p.product_id}</td>
                                <td>{p.lot_id}</td>
                                <td>{p.location_id[1]?p.location_id[1]:'-'}</td>
                                <td>{p.location_dest_id[1]?p.location_dest_id[1]:'-'}</td>
                                <td className="text-center align-middle">
                                    <StatusBadge status={p.state} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("moveHistoryTable")
);
root.render(<MoveHistoryCard />);