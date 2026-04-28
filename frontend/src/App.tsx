import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import RegisterCustomer from "./pages/RegisterCustomer";
import SearchCustomer from "./pages/SearchCustomer";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <h2>Vehicle Parts System</h2>
        <div>
          <Link to="/">Home</Link>
          <Link to="/register-customer">Register Customer</Link>
          <Link to="/search-customer">Search Customer</Link>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div className="page">
              <h1>Staff Dashboard</h1>
              <p>Princess Staff Module: customer registration and customer search.</p>
            </div>
          }
        />
        <Route path="/register-customer" element={<RegisterCustomer />} />
        <Route path="/search-customer" element={<SearchCustomer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;