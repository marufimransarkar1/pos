import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result && result.success) {
        toast.success("Login successful!");
        navigate("/", { replace: true }); // 'replace' helps prevent back-button loops
      } else {
        toast.error(result?.message || "Login failed");
      }
    } catch (error) {
      console.error("Login Crash:", error);
      toast.error("A system error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   // console.log("Attempting login for:", email); // DEBUG
  //   setLoading(true);

  //   const result = await login(email, password);
  //   // console.log("Login Result:", result); // DEBUG

  //   // ... rest of logic
  //   if (result.success) {
  //     toast.success('Login successful!');
  //     navigate('/');
  //   } else {
  //     // If result.success is false, use the message returned from Zustand
  //     toast.error(result.message || 'Login failed');
  //     setLoading(false); // Stop loading if login fails
  //   }
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   // Call login and capture the return object { success, message }
  //   const result = await login(email, password);

  //   if (result.success) {
  //     toast.success('Login successful!');
  //     navigate('/');
  //   } else {
  //     // If result.success is false, use the message returned from Zustand
  //     toast.error(result.message || 'Login failed');
  //     setLoading(false); // Stop loading if login fails
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">POS System</h1>
          <p className="text-brand-200 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            First time?{" "}
            <a
              href="/setup"
              className="text-brand-600 hover:underline font-medium"
            >
              Run Setup Wizard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
