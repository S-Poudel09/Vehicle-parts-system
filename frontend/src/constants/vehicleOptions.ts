export const VEHICLE_TYPE_OPTIONS = [
  "Car",
  "Bike",
  "SUV",
  "Truck",
  "Scooter",
  "Other",
] as const;

export const ENGINE_TYPE_OPTIONS = [
  "Petrol",
  "Diesel",
  "Hybrid",
  "Electric",
] as const;

export const DRIVING_ENVIRONMENT_OPTIONS = [
  { value: "Mixed", label: "Mixed (Standard)" },
  { value: "City", label: "City (Stop & Go)" },
  { value: "Highway", label: "Highway (Cruising)" },
  { value: "Mountainous / Off-Road", label: "Mountainous / Off-Road" },
] as const;

export type VehicleFormFields = {
  vehicleNumber: string;
  brand: string;
  model: string;
  year: string;
  vehicleType: string;
  odometer: string;
  engineType: string;
  primaryDrivingEnvironment: string;
};

export const emptyVehicleForm: VehicleFormFields = {
  vehicleNumber: "",
  brand: "",
  model: "",
  year: "",
  vehicleType: "Car",
  odometer: "",
  engineType: "Petrol",
  primaryDrivingEnvironment: "Mixed",
};

export function vehicleFormToPayload(form: VehicleFormFields) {
  return {
    vehicleNumber: form.vehicleNumber.trim(),
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: form.year.trim() ? Number(form.year) : null,
    vehicleType: form.vehicleType || null,
    odometer: form.odometer.trim() ? Number(form.odometer) : null,
    engineType: form.engineType || null,
    primaryDrivingEnvironment: form.primaryDrivingEnvironment || null,
  };
}
