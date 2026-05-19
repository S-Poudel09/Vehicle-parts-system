import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PencilSquareIcon, ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminFormModal from "../../components/admin/AdminFormModal";
import FeedbackPopup from "../../components/admin/FeedbackPopup";

type Vehicle = {
  id: number;
  vehicleNumber: string;
  brand: string;
  model: string;
  year: number | null;
};

type CustomerDetail = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  vehicles: Vehicle[];
};

type CustomerForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
};

type VehicleForm = {
  vehicleNumber: string;
  brand: string;
  model: string;
  year: string;
};

export default function StaffCustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const id = Number(customerId);

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState<"add" | "edit" | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    vehicleNumber: "",
    brand: "",
    model: "",
    year: "",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);
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

  const loadCustomer = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    try {
      const res = await API.get<CustomerDetail>(`/staff/customers/${id}`);
      setCustomer(res.data);
      setCustomerForm({
        fullName: res.data.fullName,
        email: res.data.email,
        phoneNumber: res.data.phoneNumber,
        address: res.data.address,
      });
    } catch (err: unknown) {
      setCustomer(null);
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      const status = ax.response?.status;
      const apiMessage = ax.response?.data?.message;
      setFeedback({
        open: true,
        title: "Load failed",
        message:
          status === 404 && !apiMessage
            ? "Customer endpoint is unavailable. Restart the API and try again."
            : apiMessage || "Customer not found or could not be loaded.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingCustomer(true);
    try {
      const res = await API.put<CustomerDetail>(`/staff/customers/${id}`, customerForm);
      setCustomer(res.data);
      setCustomerForm({
        fullName: res.data.fullName,
        email: res.data.email,
        phoneNumber: res.data.phoneNumber,
        address: res.data.address,
      });
      setFeedback({
        open: true,
        title: "Customer updated",
        message: "Customer details were saved successfully.",
        variant: "success",
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        open: true,
        title: "Update failed",
        message: ax.response?.data?.message || "Could not update customer.",
        variant: "error",
      });
    } finally {
      setSavingCustomer(false);
    }
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setVehicleModalMode("edit");
    setEditVehicle(vehicle);
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year != null ? String(vehicle.year) : "",
    });
  };

  const openAddVehicle = () => {
    setVehicleModalMode("add");
    setEditVehicle(null);
    setVehicleForm({ vehicleNumber: "", brand: "", model: "", year: "" });
  };

  const closeEditVehicle = () => {
    setVehicleModalMode(null);
    setEditVehicle(null);
    setVehicleForm({ vehicleNumber: "", brand: "", model: "", year: "" });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicleForm({ ...vehicleForm, [e.target.name]: e.target.value });
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !vehicleModalMode) return;
    setSavingVehicle(true);
    try {
      const payload = {
        vehicleNumber: vehicleForm.vehicleNumber.trim(),
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        year: vehicleForm.year.trim() ? Number(vehicleForm.year) : null,
      };
      if (vehicleModalMode === "add") {
        await API.post(`/staff/customers/${id}/vehicles`, payload);
        setFeedback({
          open: true,
          title: "Vehicle added",
          message: `Vehicle ${payload.vehicleNumber} was added successfully.`,
          variant: "success",
        });
      } else if (editVehicle) {
        await API.put(`/staff/customers/${id}/vehicles/${editVehicle.id}`, payload);
        setFeedback({
          open: true,
          title: "Vehicle updated",
          message: `Vehicle ${payload.vehicleNumber} was updated successfully.`,
          variant: "success",
        });
      }
      closeEditVehicle();
      await loadCustomer();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        open: true,
        title: "Update failed",
        message: ax.response?.data?.message || "Could not update vehicle.",
        variant: "error",
      });
    } finally {
      setSavingVehicle(false);
    }
  };

  if (loading) {
    return (
      <p className="text-center text-slate-500 py-12">Loading customer details…</p>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Customer not found.</p>
        <Link to="/staff/search-customer" className="btn-primary mt-4 inline-flex">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to="/staff/search-customer"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to search
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Customer Details Page
        </h1>
        <p className="mt-1.5 text-slate-500">
          View and update customer profile and vehicle records.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Customer details</h3>
          </div>
          <form onSubmit={handleSaveCustomer} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                className="input-field w-full"
                name="fullName"
                value={customerForm.fullName}
                onChange={handleCustomerChange}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className="input-field w-full"
                name="email"
                type="email"
                value={customerForm.email}
                onChange={handleCustomerChange}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                className="input-field w-full"
                name="phoneNumber"
                value={customerForm.phoneNumber}
                onChange={handleCustomerChange}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Address
              </label>
              <textarea
                className="input-field min-h-[80px] w-full resize-y"
                name="address"
                value={customerForm.address}
                onChange={handleCustomerChange}
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="btn-primary" disabled={savingCustomer}>
                {savingCustomer ? "Saving…" : "Save customer"}
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">Vehicles</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {customer.vehicles.length} registered vehicle(s)
              </p>
            </div>
            <button type="button" className="btn-secondary text-xs" onClick={openAddVehicle}>
              <PlusIcon className="h-4 w-4" />
              Add vehicle
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {customer.vehicles.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                No vehicles yet. Use Add vehicle to register one.
              </p>
            ) : (
              customer.vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-6 py-4"
                >
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {v.vehicleNumber}
                    </p>
                    <p className="mt-1">
                      {v.brand || "—"} · {v.model || "—"}
                      {v.year != null ? ` · ${v.year}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openEditVehicle(v)}
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AdminFormModal
        open={vehicleModalMode !== null}
        title={vehicleModalMode === "add" ? "Add vehicle" : "Edit vehicle"}
        subtitle={
          vehicleModalMode === "edit" && editVehicle
            ? `Update details for ${editVehicle.vehicleNumber}`
            : "Register another vehicle for this customer"
        }
        isDirty={
          vehicleForm.vehicleNumber.trim() !== "" ||
          vehicleForm.brand.trim() !== "" ||
          vehicleForm.model.trim() !== ""
        }
        onClose={closeEditVehicle}
        onSubmit={handleSaveVehicle}
        submitLabel={vehicleModalMode === "add" ? "Add vehicle" : "Save vehicle"}
        loading={savingVehicle}
      >
        <input
          className="input-field w-full"
          name="vehicleNumber"
          placeholder="Vehicle number"
          value={vehicleForm.vehicleNumber}
          onChange={handleVehicleChange}
          required
        />
        <input
          className="input-field w-full"
          name="brand"
          placeholder="Brand"
          value={vehicleForm.brand}
          onChange={handleVehicleChange}
        />
        <input
          className="input-field w-full"
          name="model"
          placeholder="Model"
          value={vehicleForm.model}
          onChange={handleVehicleChange}
        />
        <input
          className="input-field w-full"
          name="year"
          type="number"
          min={1900}
          max={2100}
          placeholder="Year (optional)"
          value={vehicleForm.year}
          onChange={handleVehicleChange}
        />
      </AdminFormModal>

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
