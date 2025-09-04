"use client";

import { useState } from "react";

const initialState = {
  fullName: "",
  email: "",
  mobile: "",
  dob: "",
};

const Form = () => {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ✅ Use GET request directly with query params
      const params = new URLSearchParams(form).toString();
      const url = `/api/generatePdf?${params}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating the PDF.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
      <div>
        <label className="label" htmlFor="fullName">
          Full Name
        </label>
        <input
          className="input"
          id="fullName"
          name="fullName"
          type="text"
          required
          value={form.fullName}
          onChange={handleChange}
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="john@example.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="mobile">
          Mobile Number
        </label>
        <input
          className="input"
          id="mobile"
          name="mobile"
          type="tel"
          required
          value={form.mobile}
          onChange={handleChange}
          placeholder="1234567890"
        />
      </div>
      <div>
        <label className="label" htmlFor="dob">
          Date of Birth
        </label>
        <input
          className="input"
          id="dob"
          name="dob"
          type="date"
          required
          value={form.dob}
          onChange={handleChange}
        />
      </div>
      <button type="submit" disabled={submitting} className="btn">
        {submitting ? "Generating..." : "Open PDF in New Tab"}
      </button>
    </form>
  );
};

export default Form;
