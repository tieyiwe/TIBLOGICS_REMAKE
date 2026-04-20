"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (password.length < 8) {
      setStatus({ type: "error", msg: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collaborators/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: "Password set! Redirecting to login…" });
        setTimeout(() => router.push("/admin/login"), 2000);
      } else {
        setStatus({ type: "error", msg: data.error ?? "Failed to accept invitation." });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-center font-dm text-[#DC2626]">Invalid invitation link. Please request a new one.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: "New Password (min 8 chars)", value: password, setter: setPassword },
        { label: "Confirm Password", value: confirm, setter: setConfirm },
      ].map(({ label, value, setter }, i) => (
        <div key={i}>
          <label className="font-dm text-sm font-medium text-[#0D1B2A] block mb-1">{label}</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setter(e.target.value)}
              required
              className="w-full border border-[#D2DCE8] rounded-xl px-4 py-2.5 pr-10 text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]"
            />
            {i === 0 && (
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] hover:text-[#3A4A5C]">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        </div>
      ))}

      {status && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-dm ${
          status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {status.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {status.msg}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full btn-primary py-3 text-sm disabled:opacity-60">
        {loading ? "Setting password…" : "Set Password & Activate Account"}
      </button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#D2DCE8] rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">
            <span className="text-[#1B3A6B]">TIB</span><span className="text-[#F47C20]">LOGICS</span>
          </h1>
          <p className="font-dm text-[#7A8FA6] text-sm mt-2">Set your password to activate your account</p>
        </div>
        <Suspense>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
