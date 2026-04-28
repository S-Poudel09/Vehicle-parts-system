import { useState } from "react";
import API from "../services/api";

function RegisterCustomer() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    vehicleNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await API.post("/staff/customers", form);
      alert("Customer registered successfully");
      setForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        vehicleNumber: "",
      });
    } catch {
      alert("Backend not ready yet. Frontend form is working.");
    }
  };

  return (
    <div className="page">
      <h1>Register Customer with Vehicle</h1>

      <form className="form" onSubmit={handleSubmit}>
        <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="phoneNumber" placeholder="Phone Number" value={form.phoneNumber} onChange={handleChange} />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
        <input name="vehicleNumber" placeholder="Vehicle Number" value={form.vehicleNumber} onChange={handleChange} />

        <button type="submit">Register Customer</button>
      </form>
    </div>
  );
}

export default RegisterCustomer;