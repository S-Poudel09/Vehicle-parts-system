import { useState } from "react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import StaffVehicleFields from "../../components/staff/StaffVehicleFields";
import {
  emptyVehicleForm,
  vehicleFormToPayload,
  type VehicleFormFields,
} from "../../constants/vehicleOptions";

type CustomerForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
} & VehicleFormFields;

const initialForm: CustomerForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  ...emptyVehicleForm,
};

export default function RegisterCustomer() {
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { vehicleNumber, brand, model, year, vehicleType, odometer, engineType, primaryDrivingEnvironment } =
        form;
      const vehiclePayload = vehicleFormToPayload({
        vehicleNumber,
        brand,
        model,
        year,
        vehicleType,
        odometer,
        engineType,
        primaryDrivingEnvironment,
      });

      const res = await API.post<{ id: number }>("/staff/customers", {
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        address: form.address,
        ...vehiclePayload,
      });
      setFeedback({
        open: true,
        title: "Customer registered",
        message: `Customer and vehicle were saved successfully (ID: ${res.data.id}). Default login password is Staff@123.`,
        variant: "success",
      });
      setForm(initialForm);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        open: true,
        title: "Registration failed",
        message:
          ax.response?.data?.message ||
          "Could not register customer. Check all fields and try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const vehicleForm: VehicleFormFields = {
    vehicleNumber: form.vehicleNumber,
    brand: form.brand,
    model: form.model,
    year: form.year,
    vehicleType: form.vehicleType,
    odometer: form.odometer,
    engineType: form.engineType,
    primaryDrivingEnvironment: form.primaryDrivingEnvironment,
  };

  return (
    <>
      <AdminPageHeader
        title="Register Customer"
        description="Create a new customer account with vehicle details for sales and service records."
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">New customer form</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Fields marked with * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-6">
          <section>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Customer details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name *
                </label>
                <input
                  className="input-field w-full"
                  name="fullName"
                  placeholder="Customer full name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  className="input-field w-full"
                  name="email"
                  type="email"
                  placeholder="customer@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone number *
                </label>
                <input
                  className="input-field w-full"
                  name="phoneNumber"
                  placeholder="98XXXXXXXX"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Address *
                </label>
                <textarea
                  className="input-field min-h-[88px] w-full resize-y"
                  name="address"
                  placeholder="Street, city"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Vehicle details
            </h4>
            <StaffVehicleFields
              form={vehicleForm}
              onChange={handleChange}
              requirePlate
            />
          </section>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <button
              type="button"
              className="btn-secondary mr-2"
              disabled={loading}
              onClick={() => setForm(initialForm)}
            >
              Clear
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <UserPlusIcon className="h-4 w-4" />
              {loading ? "Registering…" : "Register customer"}
            </button>
          </div>
        </form>
      </div>

      <FeedbackPopup
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() =>
          setFeedback((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </>
  );
}

