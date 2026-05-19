import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import "./CustomerModule.css";

export default function CustomerLandingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/login", {
        state: { message: "Registration successful! Please sign in." },
      });
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data || "User with this email already exists.");
      } else {
        setError("Registration could not be completed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="customer-public-page">
      <header className="customer-header">
        <Link to="/" className="customer-logo-link" aria-label="GadiParts home">
          <img src="/logo.png" alt="GadiParts logo" />
        </Link>

        <nav className="customer-nav" aria-label="Primary navigation">
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
        </nav>

        <Link to="/login" className="customer-login-button">
          LOGIN / REGISTER
        </Link>
      </header>

      <section className="customer-hero" id="home">
        <div className="customer-banner-video-frame" aria-label="Workshop banner video">
          <video
            className="customer-banner-video"
            src="/banner video.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        <div className="customer-hero-copy">
          <h1>GadiParts: Your Trusted Partner in Vehicle Care.</h1>
          <a href="#registration" className="customer-primary-button">
            Register Now
          </a>
        </div>
      </section>

      <section className="customer-intro-section" id="about">
        <div className="customer-intro-copy">
          <span className="customer-eyebrow">About Our Service Center</span>
          <h2>Reliable service, genuine parts, and clear customer updates.</h2>
          <p>
            GadiParts helps customers book vehicle services, request replacement
            parts, review past work, and stay informed about maintenance needs
            through one secure customer portal.
          </p>
        </div>
        <figure className="customer-service-photo">
          <img src="/gadiparts photo.png" alt="GadiParts service center" />
        </figure>
      </section>

      <section className="customer-registration-section" id="registration">
        <div className="customer-registration-copy">
          <span className="customer-eyebrow">Customer Access</span>
          <h2>Create your service account</h2>
          <p>
            Register to manage appointments, part requests, service history,
            reviews, profile details, and vehicle records.
          </p>
        </div>

        <form className="customer-registration-card" onSubmit={handleRegister}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a secure password"
              required
              minLength={6}
            />
          </label>

          {error && <div className="customer-form-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>
      </section>

      <footer className="customer-footer" id="contact">
        <span>GadiParts</span>
        <span>Service, parts, and vehicle care in one place.</span>
      </footer>
    </main>
  );
}
