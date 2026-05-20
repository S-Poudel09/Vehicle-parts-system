import { useEffect, useState, useCallback } from "react";
import {
  StarIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";

type Review = {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export default function ServiceReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | "All">("All");

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

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<Review[]>("/admin/reviews");
      setReviews(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Load failed",
        message: "Failed to load customer reviews.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await API.delete(`/admin/reviews/${id}`);
      setFeedback({
        open: true,
        title: "Deleted",
        message: "Customer review removed successfully.",
        variant: "success",
      });
      loadReviews();
    } catch {
      setFeedback({
        open: true,
        title: "Delete failed",
        message: "Failed to delete review.",
        variant: "error",
      });
    }
  };

  const filteredReviews = reviews.filter((r) => {
    return ratingFilter === "All" || r.rating === ratingFilter;
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0";
  const positivePercentage =
    totalReviews > 0
      ? (
          (reviews.filter((r) => r.rating >= 4).length / totalReviews) *
          100
        ).toFixed(0)
      : "0";

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= rating ? (
            <StarSolid key={star} className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <StarIcon key={star} className="h-4.5 w-4.5 shrink-0" />
          )
        )}
      </div>
    );
  };

  return (
    <>
      <AdminPageHeader
        title="Customer Feedback Reviews"
        description="Monitor, evaluate, and moderate rating feedback left by users regarding parts sales and repair operations."
        action={
          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-500 transition disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* Aggregate Satisfaction Cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Average Rating</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-500">
              <StarSolid className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{averageRating}</span>
            <span className="text-sm text-slate-400">out of 5.0</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Total Testimonials</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-500">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900">{totalReviews}</span>
            <span className="ml-1.5 text-sm text-slate-450 font-medium">reviews logged</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Satisfied Clients</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-500">
              <CheckBadgeIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{positivePercentage}%</span>
            <span className="text-sm text-slate-400">4★ or higher</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/75 bg-white p-4 shadow-sm">
        <span className="text-sm font-bold text-slate-800">
          Showing {filteredReviews.length} feedback review{filteredReviews.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-slate-400" />
          <select
            value={ratingFilter === "All" ? "All" : ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value === "All" ? "All" : Number(e.target.value))
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading feedback...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center text-slate-450 border border-slate-200 rounded-2xl bg-white shadow-sm">
          No feedback reviews matching your filters found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{rev.customerName}</h3>
                    <p className="text-xs text-slate-400">{rev.customerEmail}</p>
                  </div>
                  {renderStars(rev.rating)}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-650 italic">
                  "{rev.comment || <span className="text-slate-400">No comment left</span>}"
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>Submitted: {new Date(rev.createdAt).toLocaleDateString()}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(rev.id)}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Moderate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FeedbackPopup
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
