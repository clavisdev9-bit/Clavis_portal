// tampilkan 2 desimal HANYA kalau memang ada pecahannya — kalau hasil
// baginya bulat (mis. 5.00), tampilkan tanpa desimal ("5"), bukan "5.00"
function formatUnitValue(divided) {
    const rounded = Math.round(divided * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2);
}

window.formatCurrency = function formatCurrency(value) {
    const amount = Number(value);
    if (isNaN(amount)) return "-";
    if (amount >= 1_000_000_000) return `Rp. ${formatUnitValue(amount / 1_000_000_000)} B`;
    if (amount >= 1_000_000) return `Rp. ${formatUnitValue(amount / 1_000_000)} M`;
    if (amount >= 1_000) return `Rp. ${formatUnitValue(amount / 1_000)} K`;
    return `Rp.` + new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
};