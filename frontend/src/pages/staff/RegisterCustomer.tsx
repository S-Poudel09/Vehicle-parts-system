import { useState } from "react";
import API from "../../services/api";
import "./RegisterCustomer.css";

const RegisterCustomer = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    vehicleNumber: "",
    brand: "",
    model: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      await API.post("/staff/customers", form);

      setMessage("Customer registered successfully.");

      setForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        vehicleNumber: "",
        brand: "",
        model: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to register customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="register-page">
    <div className="register-wrapper">
      <h2>Register Customer</h2>
      <p>Add new customer with vehicle details.</p>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <input
            name="phoneNumber"
            placeholder="Phone Number"
            value={form.phoneNumber}
            onChange={handleChange}
            required
          />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <input
            name="vehicleNumber"
            placeholder="Vehicle Number"
            value={form.vehicleNumber}
            onChange={handleChange}
            required
          />

          <input
            name="brand"
            placeholder="Vehicle Brand"
            value={form.brand}
            onChange={handleChange}
          />
        </div>

        <input
          name="model"
          placeholder="Vehicle Model"
          value={form.model}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register Customer"}
        </button>
      </form>
    </div>
  </div>
);
};

export default RegisterCustomer;