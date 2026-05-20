import {
  DRIVING_ENVIRONMENT_OPTIONS,
  ENGINE_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type VehicleFormFields,
} from "../../constants/vehicleOptions";

type StaffVehicleFieldsProps = {
  form: VehicleFormFields;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  requirePlate?: boolean;
};

export default function StaffVehicleFields({
  form,
  onChange,
  requirePlate = false,
}: StaffVehicleFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Vehicle number {requirePlate ? "*" : ""}
        </label>
        <input
          className="input-field w-full"
          name="vehicleNumber"
          placeholder="Ba 1 Pa 1234"
          value={form.vehicleNumber}
          onChange={onChange}
          required={requirePlate}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Vehicle category
        </label>
        <select
          className="input-field w-full"
          name="vehicleType"
          value={form.vehicleType}
          onChange={onChange}
        >
          {VEHICLE_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Brand</label>
        <input
          className="input-field w-full"
          name="brand"
          placeholder="Toyota, Hyundai, etc."
          value={form.brand}
          onChange={onChange}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Model</label>
        <input
          className="input-field w-full"
          name="model"
          placeholder="Vehicle model"
          value={form.model}
          onChange={onChange}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Manufacture year
        </label>
        <input
          className="input-field w-full"
          name="year"
          type="number"
          min={1980}
          max={new Date().getFullYear() + 1}
          placeholder="e.g. 2019"
          value={form.year}
          onChange={onChange}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Current odometer (km)
        </label>
        <input
          className="input-field w-full"
          name="odometer"
          type="number"
          min={0}
          placeholder="e.g. 45000"
          value={form.odometer}
          onChange={onChange}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Engine type</label>
        <select
          className="input-field w-full"
          name="engineType"
          value={form.engineType}
          onChange={onChange}
        >
          {ENGINE_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Primary driving environment
        </label>
        <select
          className="input-field w-full"
          name="primaryDrivingEnvironment"
          value={form.primaryDrivingEnvironment}
          onChange={onChange}
        >
          {DRIVING_ENVIRONMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


