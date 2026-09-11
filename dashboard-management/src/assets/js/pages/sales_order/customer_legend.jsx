window.CustomerLegend = function CustomerLegend({
    companyGroups, customers, hiddenCustomers, expandedCompanies, customerColors,
    isSingleDate, selectedDatasets, onCustomerClick, listRef,
}) {
    const [searchCustomer, setSearchCustomer] = useState("");
    const internalListRef = React.useRef(null);
    const resolvedListRef = listRef || internalListRef;

    return (
        <div className="shrink-0 border-l border-slate-200 dark:border-slate-700">
            <div className="shrink-0 border-l border-slate-200 dark:border-slate-700 pl-3">
                <input type="text" value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)}
                    placeholder="Find customer or company"
                    className="w-full h-8 px-2 py-1 mb-2 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark dark:text-white dark:border-slate-700"
                />
                <div ref={resolvedListRef} className="overflow-y-auto" style={{ maxHeight: "350px" }}>
                    {companyGroups.map(group => {
                        const keyword = searchCustomer.trim().toLowerCase();
                        const companyMatch = group.company.toLowerCase().includes(keyword);
                        const filteredCustomers = companyMatch
                            ? group.customers
                            : group.customers.filter(({ customer }) => customer.toLowerCase().includes(keyword));

                        if (filteredCustomers.length === 0) return null;

                        return (
                            <div key={group.company} className="mb-5">
                                <div className="flex justify-between items-center cursor-pointer bg-slate-100 dark:bg-blue-950 hover:bg-slate-200 rounded px-2 py-2 font-semibold text-sm">
                                    <span className="flex-1 min-w-0 truncate text-center" title={group.company}>
                                        {group.company}
                                    </span>
                                </div>
                                {expandedCompanies[group.company] && (
                                    <div className="mt-2">
                                        {filteredCustomers.map(({ customer }, index) => {
                                            const isSelected = Array.isArray(selectedDatasets) && selectedDatasets.includes(customer);
                                            const isDimmed = Array.isArray(selectedDatasets) && selectedDatasets.length > 0 && !isSelected;

                                            return (
                                                <div
                                                    key={customer}
                                                    onClick={(e) => onCustomerClick && onCustomerClick(e, customer)}
                                                    className={`flex items-center gap-2 cursor-pointer hover:opacity-70 py-1 w-full px-1 ${
                                                        isSelected ? "bg-blue-500 text-white" : ""
                                                    }`}
                                                >
                                                    <span className={`w-5 text-right text-xs ${isSelected ? "!text-white" : ""}`}>{index + 1}.</span>
                                                    <span className="w-3 h-3" style={{
                                                        background: customerColors[customers.indexOf(customer) % customerColors.length],
                                                        opacity: hiddenCustomers.includes(customer) || isDimmed ? 0.3 : 1
                                                    }} />
                                                    <span title={customer}
                                                        className={`flex-1 break-words whitespace-normal text-xs ${
                                                            hiddenCustomers.includes(customer) ? "line-through opacity-50" : ""
                                                        } ${isSelected ? "font-semibold !text-white" : ""}`}
                                                    >
                                                        {customer}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};