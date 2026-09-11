window.formatDateRangeLabel = function formatDateRangeLabel(startDate, endDate) {
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const formatOne = (dateStr) => {
        if (!dateStr) return "";
        const d = dayjs(dateStr);
        if (!d.isValid()) return dateStr;
        return `${d.date()} ${monthNames[d.month()]} ${d.year()}`;
    };

    if (!startDate || !endDate) return "";
    return `${formatOne(startDate)} - ${formatOne(endDate)}`;
};
