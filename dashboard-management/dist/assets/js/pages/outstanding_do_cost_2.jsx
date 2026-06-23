const { BrowserRouter, Routes, Route } = ReactRouterDOM;
function Home(){
    return <h1>Home Page</h1>
}

const OutstandingDOCostTable = () => {
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home/>}/>Home
        </Routes>
    </BrowserRouter>
}

const root = ReactDOM.createRoot(
    document.getElementById("outstanding_do_cost")
);
root.render(<OutstandingDOCostTable />);