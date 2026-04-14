import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [dairyName, setDairyName] = useState("DairyPro Enterprise");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem("superadmin-auth") === "true") {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Mock validation
    if (email && password) {
      if (email === "admin@dairypro.com" && password === "admin123") {
        localStorage.setItem("superadmin-auth", "true");
        localStorage.setItem("dairy-profile", JSON.stringify({
          dairyName: dairyName || "DairyPro Enterprise",
          gstin: "24AABCU9603R1ZM",
          address: "Industrial Area, Anand, Gujarat 388001"
        }));
        navigate("/dashboard");
      } else {
        setError("Invalid email or password. Use admin@dairypro.com / admin123");
      }
    } else {
      setError("Please fill in all fields");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-green-500/10 rounded-full blur-3xl shadow-2xl"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl shadow-2xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden relative z-10 border border-slate-100">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Dairy<span className="text-green-200">Pro</span> Super Admin
          </h1>
          <p className="text-green-100 text-sm">
            Manage your network of milk collection centers
          </p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Sign In to Dashboard
          </h2>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">
                Dairy Name
              </label>
              <input
                type="text"
                value={dairyName}
                onChange={(e) => setDairyName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-slate-800 font-medium"
                placeholder="Enter Dairy Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-slate-800"
                placeholder="admin@dairypro.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-sm font-medium text-slate-600">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-green-600 hover:text-green-700">
                  Forgot Password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-slate-800"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5 transition-all mt-4"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Need center manager access?{" "}
              <a href="https://dairy-eo1r.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">
                Go to Center Portal
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
