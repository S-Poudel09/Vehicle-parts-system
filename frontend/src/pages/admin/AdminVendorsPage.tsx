import { useEffect, useMemo, useState } from "react";
import {
  BuildingStorefrontIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import ConfirmPopup from "../../components/admin/ConfirmPopup";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import AdminListControls from "../../components/admin/AdminListControls";
import ListPagination from "../../components/common/ListPagination";

type VendorRow = {
  id: number;
  name: string;
  phone: string;
  address: string;
  partIds: number[];
  purchaseIds: number[];
};

type VendorForm = {
  name: string;
  phone: string;
  address: string;
};

const initialForm: VendorForm = { name: "", phone: "", address: "" };

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [createForm, setCreateForm] = useState<VendorForm>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<VendorForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkFilter, setLinkFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
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

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => a.name.localeCompare(b.name)),
    [vendors]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, linkFilter, pageSize]);

  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return sortedVendors.filter((v) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        v.name.toLowerCase().includes(normalizedQuery) ||
        v.phone.toLowerCase().includes(normalizedQuery) ||
        v.address.toLowerCase().includes(normalizedQuery) ||
        String(v.id).includes(normalizedQuery);

      const hasLinks = v.partIds.length > 0 || v.purchaseIds.length > 0;
      const matchesLinkFilter =
        linkFilter === "all" ||
        (linkFilter === "linked" && hasLinks) ||
        (linkFilter === "unlinked" && !hasLinks);

      return matchesQuery && matchesLinkFilter;
    });
  }, [sortedVendors, searchQuery, linkFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const loadVendors = async () => {
    try {
      const res = await API.get<VendorRow[]>("/vendor");
      setVendors(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Failed to load",
        message: "Failed to load vendors.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post<VendorRow>("/vendor", createForm);
      setFeedback({
        open: true,
        title: "Vendor created",
        message: `Vendor created successfully (ID: ${res.data.id}).`,
        variant: "success",
      });
      setCreateForm(initialForm);
      await loadVendors();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const responseMessage =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message;
      setFeedback({
        open: true,
        title: "Create failed",
        message: responseMessage || "Could not create vendor.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (vendor: VendorRow) => {
    setEditId(vendor.id);
    setEditForm({
      name: vendor.name,
      phone: vendor.phone,
      address: vendor.address,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(initialForm);
  };

  const handleUpdate = async (id: number) => {
    setLoading(true);

    try {
      await API.put(`/vendor/${id}`, editForm);
      setFeedback({
        open: true,
        title: "Vendor updated",
        message: `Vendor #${id} updated successfully.`,
        variant: "success",
      });
      setEditId(null);
      setEditForm(initialForm);
      await loadVendors();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const responseMessage =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message;
      setFeedback({
        open: true,
        title: "Update failed",
        message: responseMessage || "Could not update vendor.",
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
      await API.delete(`/vendor/${deleteTargetId}`);
      setFeedback({
        open: true,
        title: "Vendor deleted",
        message: `Vendor #${deleteTargetId} was deleted.`,
        variant: "success",
      });
      if (editId === deleteTargetId) {
        cancelEdit();
      }
      setDeleteTargetId(null);
      await loadVendors();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const responseMessage =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message;
      setFeedback({
        open: true,
        title: "Delete failed",
        message:
          responseMessage ||
          "Delete failed. Vendor may be linked to existing purchases.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Vendor Management
        </h1>
        <p className="mt-1.5 text-slate-500">
          Manage suppliers used for parts purchasing and stock entries.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
          <BuildingStorefrontIcon className="h-5 w-5 text-slate-600" />
          Add New Vendor
        </h3>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          onSubmit={handleCreate}
        >
          <input
            className="input-field"
            name="name"
            placeholder="Vendor name"
            value={createForm.name}
            onChange={handleCreateChange}
            required
          />
          <input
            className="input-field"
            name="phone"
            placeholder="Phone number"
            value={createForm.phone}
            onChange={handleCreateChange}
            required
          />
          <textarea
            className="input-field min-h-[42px] resize-y sm:col-span-2 lg:col-span-1"
            name="address"
            placeholder="Address"
            value={createForm.address}
            onChange={handleCreateChange}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : "Create Vendor"}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Vendor Directory</h3>
        </div>
        <AdminListControls
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by ID, name, phone, or address"
          filterLabel="Link status"
          filterValue={linkFilter}
          onFilterChange={setLinkFilter}
          filterOptions={[
            { value: "all", label: "All vendors" },
            { value: "linked", label: "Has linked records" },
            { value: "unlinked", label: "No linked records" },
          ]}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={filteredVendors.length}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Linked Records
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No matching vendors found.
                  </td>
                </tr>
              ) : (
                paginatedVendors.map((v) => {
                  const isEditing = editId === v.id;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-slate-100 align-top transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        #{v.id}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {isEditing ? (
                          <input
                            className="input-field w-full min-w-[180px]"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            required
                          />
                        ) : (
                          v.name
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {isEditing ? (
                          <input
                            className="input-field w-full min-w-[140px]"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleEditChange}
                            required
                          />
                        ) : (
                          v.phone
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {isEditing ? (
                          <textarea
                            className="input-field min-h-[42px] w-full min-w-[220px] resize-y"
                            name="address"
                            value={editForm.address}
                            onChange={handleEditChange}
                            required
                          />
                        ) : (
                          v.address
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Parts: {v.partIds.length}
                        </span>
                        <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Purchases: {v.purchaseIds.length}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleUpdate(v.id)}
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
                              onClick={() => startEdit(v)}
                              className="btn-secondary"
                            >
                              <PencilSquareIcon className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(v.id)}
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

      <ConfirmPopup
        open={deleteTargetId !== null}
        title="Delete vendor?"
        message="This action permanently removes the vendor record."
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
