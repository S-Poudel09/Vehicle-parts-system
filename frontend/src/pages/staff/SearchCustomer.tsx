import { useState } from "react";
import API from "../../services/api";
import "./SearchCustomer.css";

type Customer = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  vehicleNumber?: string;
  model?: string;
  brand?: string;
};

function SearchCustomer() {
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setMessage("Please enter customer name, phone number, ID, or vehicle number.");
      setCustomers([]);
      return;
    }

    try {
      const res = await API.get(
        `/staff/customers/search?query=${encodeURIComponent(keyword)}`
      );

      setCustomers(res.data);

      if (res.data.length === 0) {
        setMessage("No customer found.");
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to search customers. Please check backend or login token.");
      setCustomers([]);
    }
  };

  return (
    <div className="search-page">
      <div className="search-wrapper">
        <h2>Search Customers</h2>

        <p>
          Search customers by name, phone number, customer ID,
          or vehicle number.
        </p>

        <div className="search-form">
          <input
            type="text"
            placeholder="Enter name, phone, ID, or vehicle number"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button onClick={handleSearch}>Search</button>
        </div>

        {message && <p className="error-message">{message}</p>}

        {customers.length > 0 && (
          <div className="search-results">
            {customers.map((customer) => (
              <div
                className="customer-card"
                key={`${customer.id}-${customer.vehicleNumber}`}
              >
                <h3>{customer.fullName}</h3>

                <p>
                  <strong>Customer ID:</strong> {customer.id}
                </p>

                <p>
                  <strong>Phone:</strong> {customer.phoneNumber}
                </p>

                <p>
                  <strong>Email:</strong> {customer.email}
                </p>

                <p>
                  <strong>Address:</strong> {customer.address}
                </p>

                <p>
                  <strong>Vehicle Number:</strong>{" "}
                  {customer.vehicleNumber || "N/A"}
                </p>

                <p>
                  <strong>Model:</strong> {customer.model || "N/A"}
                </p>

                <p>
                  <strong>Brand:</strong> {customer.brand || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchCustomer;