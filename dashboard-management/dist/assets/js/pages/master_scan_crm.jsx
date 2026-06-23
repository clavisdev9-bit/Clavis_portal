const { createRoot } = ReactDOM;

function ScanDetailsTable() {
    const data = [
        { id: 1, name: "John Doe", amount: 1200000, status: "Active" },
        { id: 2, name: "Jane Smith", amount: 850000, status: "Pending" },
        { id: 3, name: "Michael Brown", amount: 430000, status: "Inactive" },
    ];
    console.log(data);

    return (
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full min-w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                </thead>

                <tbody className="divide-y">
                    {data.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">{item.id}</td>
                            <td className="px-4 py-3">{item.name}</td>
                            <td className="px-4 py-3 text-right">
                                Rp {item.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs
                                        ${item.status === "Active" && "bg-green-100 text-green-700"}
                                        ${item.status === "Pending" && "bg-yellow-100 text-yellow-700"}
                                        ${item.status === "Inactive" && "bg-red-100 text-red-700"}
                                    `}
                                >
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
const root = createRoot(document.getElementById("scanDetails"));
root.render(<ScanDetailsTable />);