"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Loader2, Calendar, Bell, Mail } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  currency: string;
  location: string;
  date?: string | null;
  timeSlot?: string | null;
  description: string;
  content?: string | null;
  capacity?: number | null;
  spots?: number | null;
  coverImage?: string | null;
  stripePaymentLink?: string | null;
  registrationOpen: boolean;
  featured: boolean;
  published: boolean;
  tags: string[];
  createdAt: string;
}

type FormData = {
  title: string;
  type: string;
  description: string;
  content: string;
  date: string;
  timeSlot: string;
  location: string;
  price: string;
  capacity: string;
  spots: string;
  coverImage: string;
  stripePaymentLink: string;
  registrationOpen: boolean;
  featured: boolean;
  published: boolean;
};

const EMPTY_FORM: FormData = {
  title: "",
  type: "TRAINING",
  description: "",
  content: "",
  date: "",
  timeSlot: "",
  location: "Online",
  price: "0",
  capacity: "",
  spots: "",
  coverImage: "",
  stripePaymentLink: "",
  registrationOpen: true,
  featured: false,
  published: false,
};

const TYPE_COLORS: Record<string, string> = {
  TRAINING: "bg-[#2251A3]/10 text-[#2251A3]",
  EVENT: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-emerald-100 text-emerald-700",
  WEBINAR: "bg-teal-100 text-teal-700",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface NotifySignup {
  id: string;
  email: string;
  firstName?: string | null;
  source: string;
  subscribedAt: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notifySignups, setNotifySignups] = useState<NotifySignup[]>([]);

  async function loadEvents() {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifySignups() {
    try {
      const res = await fetch("/api/events/notify");
      if (res.ok) {
        const data = await res.json();
        setNotifySignups(data.subscribers ?? []);
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    loadEvents();
    loadNotifySignups();
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(event: EventItem) {
    setEditId(event.id);
    setForm({
      title: event.title,
      type: event.type,
      description: event.description,
      content: event.content ?? "",
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
      timeSlot: event.timeSlot ?? "",
      location: event.location,
      price: String(event.price),
      capacity: event.capacity != null ? String(event.capacity) : "",
      spots: event.spots != null ? String(event.spots) : "",
      coverImage: event.coverImage ?? "",
      stripePaymentLink: event.stripePaymentLink ?? "",
      registrationOpen: event.registrationOpen,
      featured: event.featured,
      published: event.published,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
        content: form.content.trim() || null,
        date: form.date || null,
        timeSlot: form.timeSlot.trim() || null,
        location: form.location.trim() || "Online",
        price: parseInt(form.price) || 0,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        spots: form.spots ? parseInt(form.spots) : null,
        coverImage: form.coverImage.trim() || null,
        stripePaymentLink: form.stripePaymentLink.trim() || null,
        registrationOpen: form.registrationOpen,
        featured: form.featured,
        published: form.published,
        tags: [],
      };

      if (editId) {
        await fetch(`/api/admin/events/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      await loadEvents();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(event: EventItem) {
    setTogglingId(event.id);
    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !event.published }),
      });
      await loadEvents();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      await loadEvents();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Events &amp; Training</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">Manage live events, workshops, and training sessions</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: events.length },
          { label: "Published", value: events.filter((e) => e.published).length },
          { label: "Featured", value: events.filter((e) => e.featured).length },
          { label: "Free", value: events.filter((e) => e.price === 0).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#D2DCE8] rounded-2xl p-4 text-center">
            <p className="font-syne font-bold text-2xl text-[#1B3A6B]">{stat.value}</p>
            <p className="font-dm text-xs text-[#7A8FA6] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#2251A3]" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-16 text-center">
          <Calendar size={40} className="text-[#D2DCE8] mx-auto mb-4" />
          <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mb-2">No events yet</h3>
          <p className="font-dm text-[#7A8FA6] mb-6">No events yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] text-white font-dm font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Create First Event
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Title</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Price</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2DCE8]">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-[#F4F7FB] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-dm font-semibold text-sm text-[#0D1B2A] line-clamp-1">{event.title}</p>
                      <p className="font-dm text-xs text-[#7A8FA6]">/events/{event.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-dm font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700"}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-dm text-sm text-[#3A4A5C]">
                        {event.date ? formatDate(event.date) : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {event.price === 0 ? (
                        <span className="font-dm text-sm font-semibold text-green-600">Free</span>
                      ) : (
                        <span className="font-dm text-sm text-[#3A4A5C]">${(event.price / 100).toFixed(0)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublished(event)}
                        disabled={togglingId === event.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-dm font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          event.published
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {togglingId === event.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : event.published ? (
                          <Eye size={10} />
                        ) : (
                          <EyeOff size={10} />
                        )}
                        {event.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(event)}
                          className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-[#2251A3] hover:bg-[#EBF0FA] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="p-1.5 rounded-lg text-[#7A8FA6] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          {deletingId === event.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notification Sign-ups */}
      {notifySignups.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-[#F47C20]" />
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Notification Sign-ups</h2>
            <span className="ml-auto text-xs font-dm font-semibold bg-[#F47C20]/10 text-[#F47C20] px-2 py-0.5 rounded-full">
              {notifySignups.length}
            </span>
          </div>
          <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Event</th>
                  <th className="text-left font-dm font-semibold text-xs text-[#7A8FA6] uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2DCE8]">
                {notifySignups.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F4F7FB] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-dm text-sm text-[#0D1B2A]">{s.firstName || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${s.email}`} className="font-dm text-sm text-[#2251A3] hover:underline flex items-center gap-1">
                        <Mail size={12} /> {s.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-dm text-xs text-[#7A8FA6]">
                        {s.source.replace("event-notify:", "").replace("event-notify", "General")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-dm text-xs text-[#7A8FA6]">
                        {new Date(s.subscribedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D2DCE8]">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">
                {editId ? "Edit Event" : "New Event"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-[#7A8FA6] hover:bg-[#F4F7FB] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Title */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Practical AI for Business"
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                >
                  <option value="TRAINING">Training</option>
                  <option value="EVENT">Event</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="WEBINAR">Webinar</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description shown on listing page..."
                  rows={3}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">
                  Content <span className="text-[#7A8FA6] font-normal">(optional — HTML supported)</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="<p>Full event description, agenda, what you'll learn...</p>"
                  rows={5}
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-none font-mono"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Date</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                  />
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Time Slot</label>
                  <input
                    type="text"
                    value={form.timeSlot}
                    onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                    placeholder="10:00 AM - 12:00 PM ET"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Online"
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                />
              </div>

              {/* Price + Capacity + Spots */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Price (cents)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0 = free"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                  />
                  <p className="text-xs font-dm text-[#7A8FA6] mt-0.5">0 = free</p>
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    placeholder="Optional"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                  />
                </div>
                <div>
                  <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">Spots</label>
                  <input
                    type="number"
                    min="0"
                    value={form.spots}
                    onChange={(e) => setForm((f) => ({ ...f, spots: e.target.value }))}
                    placeholder="Available"
                    className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">
                  Cover Image URL <span className="text-[#7A8FA6] font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                />
              </div>

              {/* Stripe */}
              <div>
                <label className="block font-dm font-semibold text-sm text-[#0D1B2A] mb-1.5">
                  Stripe Payment Link <span className="text-[#7A8FA6] font-normal">(optional, for paid events)</span>
                </label>
                <input
                  type="url"
                  value={form.stripePaymentLink}
                  onChange={(e) => setForm((f) => ({ ...f, stripePaymentLink: e.target.value }))}
                  placeholder="https://buy.stripe.com/..."
                  className="w-full border border-[#D2DCE8] rounded-xl px-3 py-2.5 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-1">
                {(
                  [
                    { key: "registrationOpen", label: "Registration Open" },
                    { key: "featured", label: "Featured" },
                    { key: "published", label: "Published" },
                  ] as { key: keyof FormData; label: string }[]
                ).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#D2DCE8] text-[#2251A3] focus:ring-[#2251A3]/30"
                    />
                    <span className="font-dm text-sm text-[#3A4A5C]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D2DCE8]">
              <button
                onClick={() => setShowModal(false)}
                className="font-dm text-sm text-[#7A8FA6] hover:text-[#3A4A5C] px-4 py-2 rounded-xl hover:bg-[#F4F7FB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="inline-flex items-center gap-2 bg-[#F47C20] hover:bg-[#e06a10] disabled:opacity-50 disabled:cursor-not-allowed text-white font-dm font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editId ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
