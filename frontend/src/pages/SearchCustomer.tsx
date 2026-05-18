import { useState } from "react";
import API from "../services/api";
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
    <div className="staff-page">
      <h1>Search Customers</h1>
      <p>Search customers by name, phone number, customer ID, or vehicle number.</p>

      <div className="search-box">
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

      {message && <p className="message">{message}</p>}

      {customers.length > 0 && (
        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Vehicle Number</th>
              <th>Model</th>
              <th>Brand</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={`${customer.id}-${customer.vehicleNumber}`}>
                <td>{customer.id}</td>
                <td>{customer.fullName}</td>
                <td>{customer.phoneNumber}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>{customer.vehicleNumber || "N/A"}</td>
                <td>{customer.model || "N/A"}</td>
                <td>{customer.brand || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SearchCustomer;