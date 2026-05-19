import { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminFormModal from "../../components/admin/AdminFormModal";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ConfirmPopup from "../../components/admin/ConfirmPopup";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import ListPagination from "../../components/common/ListPagination";
import { useTablePagination } from "../../hooks/useTablePagination";

type PartRow = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
};

type PartForm = {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
};

const initialForm: PartForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

export default function AdminPartsPage() {
  const [parts, setParts] = useState<PartRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PartForm>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PartForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const matchesSearch =
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.description.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStock = true;
      if (stockStatus === "low") {
        matchesStock = part.stock < 10 && part.stock > 0;
      } else if (stockStatus === "out") {
        matchesStock = part.stock === 0;
      } else if (stockStatus === "instock") {
        matchesStock = part.stock >= 10;
      }

      let matchesMinPrice = true;
      if (minPrice.trim() !== "") {
        const minVal = parseFloat(minPrice);
        if (!isNaN(minVal)) {
          matchesMinPrice = part.price >= minVal;
        }
      }

      let matchesMaxPrice = true;
      if (maxPrice.trim() !== "") {
        const maxVal = parseFloat(maxPrice);
        if (!isNaN(maxVal)) {
          matchesMaxPrice = part.price <= maxVal;
        }
      }

      return matchesSearch && matchesStock && matchesMinPrice && matchesMaxPrice;
    });
  }, [parts, searchQuery, stockStatus, minPrice, maxPrice]);

  const sortedParts = useMemo(
    () => [...filteredParts].sort((a, b) => a.name.localeCompare(b.name)),
    [filteredParts]
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedParts,
  } = useTablePagination(sortedParts, 4);

  const isCreateDirty =
    createForm.name.trim() !== "" ||
    createForm.description.trim() !== "" ||
    createForm.imageUrl !== "" ||
    createForm.price.trim() !== "";

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateForm(initialForm);
  };

  const loadParts = async () => {
    try {
      const res = await API.get<PartRow[]>("/part");
      setParts(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Failed to load",
        message: "Failed to load parts list.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  const onCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const onEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleCreateImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback({
        open: true,
        title: "Invalid file",
        message: "Please select an image file.",
        variant: "error",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFeedback({
        open: true,
        title: "File too large",
        message: "Please choose an image under 2MB.",
        variant: "error",
      });
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCreateForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch {
      setFeedback({
        open: true,
        title: "Image upload failed",
        message: "Could not read selected image.",
        variant: "error",
      });
    }
  };

  const handleEditImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback({
        open: true,
        title: "Invalid file",
        message: "Please select an image file.",
        variant: "error",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFeedback({
        open: true,
        title: "File too large",
        message: "Please choose an image under 2MB.",
        variant: "error",
      });
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setEditForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch {
      setFeedback({
        open: true,
        title: "Image upload failed",
        message: "Could not read selected image.",
        variant: "error",
      });
    }
  };

  const startEdit = (part: PartRow) => {
    setEditId(part.id);
    setEditForm({
      name: part.name,
      description: part.description,
      imageUrl: part.imageUrl ?? "",
      price: String(part.price),
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(initialForm);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: createForm.name,
        description: createForm.description,
        imageUrl: createForm.imageUrl,
        price: Number(createForm.price),
      };
      const res = await API.post<PartRow>("/part", payload);
      closeCreateModal();
      setFeedback({
        open: true,
        title: "Part created",
        message: `Part ${res.data.name} created with stock 0.`,
        variant: "success",
      });
      await loadParts();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const message =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message ?? "Could not create part.";
      setFeedback({
        open: true,
        title: "Create failed",
        message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    setLoading(true);
    try {
      const payload = {
        name: editForm.name,
        description: editForm.description,
        imageUrl: editForm.imageUrl,
        price: Number(editForm.price),
      };
      await API.put(`/part/${id}`, payload);
      setFeedback({
        open: true,
        title: "Part updated",
        message: `Part #${id} updated successfully.`,
        variant: "success",
      });
      cancelEdit();
      await loadParts();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const message =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message ?? "Could not update part.";
      setFeedback({
        open: true,
        title: "Update failed",
        message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      await API.delete(`/part/${deleteTargetId}`);
      setFeedback({
        open: true,
        title: "Part deleted",
        message: `Part #${deleteTargetId} was deleted.`,
        variant: "success",
      });
      setDeleteTargetId(null);
      await loadParts();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const message =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message ??
            "Delete failed. Part may already be used in invoices.";
      setFeedback({
        open: true,
        title: "Delete failed",
        message,
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Parts"
        description="Define part master data. Stock starts at 0 and increases only after confirmed purchases."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Add Part
          </button>
        }
      />

      {/* Advanced Search & Filtering Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-12">
          {/* Search Query */}
          <div className="sm:col-span-4">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Search Parts
            </label>
            <input
              type="text"
              placeholder="Search by name or description..."
              className="input-field w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Stock Status Dropdown */}
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Status
            </label>
            <select
              className="input-field w-full"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="instock">In Stock (&gt;= 10)</option>
              <option value="low">Low Stock (&lt; 10)</option>
              <option value="out">Out of Stock (= 0)</option>
            </select>
          </div>

          {/* Min Price */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Min Price (Rs)
            </label>
            <input
              type="number"
              placeholder="Min"
              min="0"
              className="input-field w-full"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          {/* Max Price */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Max Price (Rs)
            </label>
            <input
              type="number"
              placeholder="Max"
              min="0"
              className="input-field w-full"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Clear Filters */}
          <div className="sm:col-span-1 flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStockStatus("all");
                setMinPrice("");
                setMaxPrice("");
              }}
              className="btn-secondary w-full py-2.5 text-center text-xs font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Parts Catalog</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {sortedParts.length} part(s) · 4 per page
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Part
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Selling Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedParts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No parts found.
                  </td>
                </tr>
              ) : (
                paginatedParts.map((p) => {
                  const isEditing = editId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 align-top transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        #{p.id}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              className="input-field w-full min-w-[180px]"
                              name="name"
                              value={editForm.name}
                              onChange={onEditChange}
                              required
                            />
                            <input
                              className="input-field w-full min-w-[180px]"
                              type="file"
                              accept="image/*"
                              onChange={handleEditImageSelect}
                            />
                            {editForm.imageUrl && (
                              <img
                                src={editForm.imageUrl}
                                alt={editForm.name}
                                className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                                No img
                              </div>
                            )}
                            <span className="font-semibold text-slate-900">{p.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {isEditing ? (
                          <textarea
                            className="input-field min-h-[42px] w-full min-w-[220px] resize-y"
                            name="description"
                            value={editForm.description}
                            onChange={onEditChange}
                            required
                          />
                        ) : (
                          p.description
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {isEditing ? (
                          <input
                            className="input-field w-full min-w-[130px]"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            onChange={onEditChange}
                            required
                          />
                        ) : (
                          `Rs ${p.price.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleUpdate(p.id)}
                                className="btn-primary-sm"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn-secondary"
                              >
                                <XMarkIcon className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="btn-secondary"
                            >
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(p.id)}
                            className="btn-danger"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <AdminFormModal
        open={createOpen}
        title="Add Part"
        subtitle="New parts start with stock 0."
        isDirty={isCreateDirty}
        onClose={closeCreateModal}
        onSubmit={handleCreate}
        submitLabel="Create Part"
        loading={loading}
        maxWidthClass="max-w-xl"
      >
        <input
          className="input-field w-full"
          name="name"
          placeholder="Part name"
          value={createForm.name}
          onChange={onCreateChange}
          required
        />
        <input
          className="input-field w-full"
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Selling price"
          value={createForm.price}
          onChange={onCreateChange}
          required
        />
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Part image
          </label>
          <input
            className="input-field w-full"
            type="file"
            accept="image/*"
            onChange={handleCreateImageSelect}
          />
        </div>
        <textarea
          className="input-field min-h-[88px] w-full resize-y"
          name="description"
          placeholder="Description"
          value={createForm.description}
          onChange={onCreateChange}
          required
        />
        {createForm.imageUrl && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Preview
            </p>
            <img
              src={createForm.imageUrl}
              alt="Selected part"
              className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
            />
          </div>
        )}
      </AdminFormModal>

      <ConfirmPopup
        open={deleteTargetId !== null}
        title="Delete part?"
        message="This action permanently removes the part definition."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setDeleteTargetId(null);
        }}
        confirmDisabled={deleting}
      />
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
