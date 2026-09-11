// Hook kecil untuk fitur "klik item CustomerLegend -> highlight garis di
// SalesTrendChart". Dipakai di sales_order_card.jsx (chart utama) dan
// sales_stats_modal.jsx (chart di modal), masing-masing dengan state-nya
// sendiri-sendiri (tidak saling memengaruhi).
//
// listRef: ref ke elemen wrapper daftar customer di CustomerLegend — dipakai
// untuk mendeteksi klik di luar list (reset highlight).
window.useDatasetHighlight = function useDatasetHighlight(listRef) {
    const [selectedDatasets, setSelectedDatasets] = React.useState([]);

    const handleDatasetClick = (event, customer) => {
        const isMultiSelect = event.ctrlKey || event.metaKey; // metaKey = Cmd di Mac

        setSelectedDatasets((prev) => {
            if (isMultiSelect) {
                // Ctrl/Cmd + Click -> toggle customer ini di dalam seleksi yang sudah ada
                return prev.includes(customer)
                    ? prev.filter((c) => c !== customer)
                    : [...prev, customer];
            }
            // Klik biasa -> reset, hanya customer ini yang dipilih
            return [customer];
        });
    };

    const resetHighlight = () => setSelectedDatasets([]);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            const insideList = listRef && listRef.current && listRef.current.contains(event.target);
            if (!insideList) {
                resetHighlight();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [listRef]);

    return { selectedDatasets, handleDatasetClick, resetHighlight };
};
