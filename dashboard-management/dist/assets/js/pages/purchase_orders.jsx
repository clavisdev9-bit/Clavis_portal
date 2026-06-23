function PurchaseOrderCard(){
    return (
                <div class="flex gap-4">
  <div class="grow-3 size-14 bg-blue-500">01</div>
  <div class="grow-7 size-14 bg-blue-500">02</div>
  <div class="grow-3 size-14 bg-blue-500">03</div>
</div>
    );
}
const root = ReactDOM.createRoot(
    document.getElementById("purchaseOrderTable")
);
root.render(<PurchaseOrderCard />);