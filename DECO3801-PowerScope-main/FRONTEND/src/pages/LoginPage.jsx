import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function validate() {
    const errs = {};
    if (!form.username) errs.username = "Username is required";
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    return errs;
  }

  async function handleSubmit(e) {
  e.preventDefault();
  const errs = validate();
  setErrors(errs);
  if (Object.keys(errs).length) return;

  setLoading(true);
  setTimeout(() => {
    setLoading(false);
    // Store username in localStorage for dashboard display
    localStorage.setItem('username', form.username);
    navigate("/dashboard", { replace: true }); 
  }, 1200);
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/the-university-of-queensland-logo-png_seeklogo-479574.svg" alt="UQ Logo" className="h-14 mb-2" />
          <h1 className="text-2xl font-bold text-purple-700">UQ Energy Analytics</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.username ? "border-red-500" : "border-gray-300"}`}
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              placeholder="Enter your username"
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.email ? "border-red-500" : "border-gray-300"}`}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.password ? "border-red-500" : "border-gray-300"}`}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={e => setForm({ ...form, remember: e.target.checked })}
                className="mr-2 accent-purple-600"
              />
              Remember me
            </label>
            <a href="#" className="text-sm text-purple-600 hover:underline">Forgot Password?</a>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg bg-purple-600 text-white font-semibold transition hover:bg-purple-700 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}