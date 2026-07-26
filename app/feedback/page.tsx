"use client";

import { useState } from "react";
import { browserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const supabase = browserClient();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    overall_rating: 0,
    most_useful: "",
    biggest_frustration: "",
    missing_features: "",
    would_recommend: null as boolean | null,
    open_feedback: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    if (!supabase) {
      alert("Account sync isn't available right now.");
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase!.from("feedback").insert({
      ...form,
      user_id: user?.id ?? null,
      current_version: "0.1",
    });
    setLoading(false);
    if (!error) setSubmitted(true);
    else alert("Something went wrong — please try again.");
  };

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">💗</div>
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="text-gray-500 max-w-sm">Your feedback helps us build something better for the PMOS community.</p>
      <button onClick={() => router.push("/")} className="mt-4 px-6 py-2 rounded-full bg-pink-500 text-white text-sm">
        Back to home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Share your feedback 💗</h1>
        <p className="text-gray-500 text-sm mt-1">Takes under 2 minutes. Helps us build what you actually need.</p>
      </div>

      {/* Star rating */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm">How useful has MyPMOS been for your PMOS journey?</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setForm(f => ({ ...f, overall_rating: n }))}
              className={`text-2xl transition-transform ${form.overall_rating >= n ? "scale-110" : "opacity-30"}`}>
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Text questions */}
      {[
        { key: "most_useful", label: "What feature do you use most or find most helpful?" },
        { key: "biggest_frustration", label: "What frustrates you or feels missing?" },
        { key: "missing_features", label: "Is there something about your PMOS experience the app doesn't capture but you wish it did?" },
      ].map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="font-medium text-sm">{label}</label>
          <textarea rows={2}
            className="border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={(form as any)[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          />
        </div>
      ))}

      {/* Would recommend */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm">Would you recommend MyPMOS to a friend with PMOS?</label>
        <div className="flex gap-3">
          {([["yes", true], ["not yet", false]] as const).map(([label, val]) => (
            <button key={label} onClick={() => setForm(f => ({ ...f, would_recommend: val }))}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${form.would_recommend === val ? "bg-pink-500 text-white border-pink-500" : "border-gray-300 text-gray-600"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Open field */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm">Anything else you'd like us to know? <span className="text-gray-400">(optional)</span></label>
        <textarea rows={3}
          className="border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
          value={form.open_feedback}
          onChange={e => setForm(f => ({ ...f, open_feedback: e.target.value }))}
        />
      </div>

      <button onClick={handleSubmit} disabled={loading || form.overall_rating === 0}
        className="w-full py-3 rounded-full bg-pink-500 text-white font-medium disabled:opacity-40 transition-opacity">
        {loading ? "Submitting..." : "Submit feedback"}
      </button>
    </div>
  );
}
