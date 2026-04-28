import { useState } from "react";
import API from "../services/api";

type Customer = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  vehicleNumber: string;
};

function SearchCustomer() {
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    try {
      const res = await API.get("/staff/customers");
      const allCustomers: Customer[] = res.data;

      const filtered = allCustomers.filter((c) =>
        `${c.fullName} ${c.email} ${c.phoneNumber} ${c.address} ${c.vehicleNumber}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      );

      setCustomers(filtered);
      setMessage("");
    } catch {
      setMessage("Backend not ready yet. Search UI is ready.");
    }
  };

  return (
    <div className="page">
      <h1>Search Customers</h1>

      <div className="search-box">
        <input
          placeholder="Search by name, phone, email, address, or vehicle number"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {message && <p>{message}</p>}

      <div className="cards">
        {customers.map((c, index) => (
          <div className="card" key={index}>
            <h3>{c.fullName}</h3>
            <p>Email: {c.email}</p>
            <p>Phone: {c.phoneNumber}</p>
            <p>Address: {c.address}</p>
            <p>Vehicle Number: {c.vehicleNumber}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchCustomer;