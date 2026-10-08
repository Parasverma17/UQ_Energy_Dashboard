import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-white shadow flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-2">
        <img src="/uq_logo.svg" alt="UQ Logo" className="h-8" />
        <span className="font-bold text-purple-700 text-lg">UQ Energy Analytics</span>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-100 transition"
        >
          <span className="font-medium">John Doe</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
            <button className="w-full text-left px-4 py-2 hover:bg-purple-50 transition">Profile</button>
            <button className="w-full text-left px-4 py-2 hover:bg-purple-50 transition">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function StatsCard({ title, value, icon, color }) {
  return (
    <div className={`flex flex-col items-center bg-white rounded-xl shadow p-5 transition hover:scale-105 hover:shadow-lg ${color}`}>
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 py-4 text-center text-gray-500 text-sm">
      &copy; {new Date().getFullYear()} UQ Energy Analytics &mdash; Last updated: Sep 2025
    </footer>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <section className="max-w-2xl text-center mt-12 mb-8">
          <h1 className="text-4xl font-extrabold text-purple-700 mb-3">Welcome to UQ Energy Analytics</h1>
          <p className="text-lg text-gray-700 mb-6">
            Monitor, analyze, and optimize energy usage across UQ campuses. Gain insights, track savings, and drive sustainability with real-time analytics.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold shadow transition hover:bg-purple-700 hover:scale-105"
          >
            Get Started
          </button>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
          <StatsCard
            title="Total Campuses"
            value="5"
            icon={<svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 7v4a1 1 0 001 1h3v4a1 1 0 001 1h6a1 1 0 001-1v-4h3a1 1 0 001-1V7" /></svg>}
            color="hover:bg-purple-50"
          />
          <StatsCard
            title="Buildings Monitored"
            value="42"
            icon={<svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 21V7a1 1 0 011-1h14a1 1 0 011 1v14" /></svg>}
            color="hover:bg-blue-50"
          />
          <StatsCard
            title="Energy Saved (MWh)"
            value="1,250"
            icon={<svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            color="hover:bg-green-50"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}