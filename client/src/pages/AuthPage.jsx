import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";

const AuthPage = ({ mode, setToast }) => {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const location = useLocation();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.signup(form);

      saveAuth(data);
      setToast({ type: "success", message: data.message });
      navigate(location.state?.from || "/generate");
    } catch (error) {
      setToast({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="glass-card rounded-[32px] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-pink">
            {isLogin ? "Welcome back" : "Create account"}
          </p>
          <h1 className="mt-4 text-4xl font-black text-white">
            {isLogin ? "Log in to Thumblify" : "Start generating smarter thumbnails"}
          </h1>
          <p className="mt-4 text-slate-300">
            JWT auth, simple credits, and a clean workflow built for creators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-[32px] p-8">
          <div className="space-y-5">
            {!isLogin ? (
              <div>
                <label className="mb-2 block text-sm text-slate-200">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-pink/40"
                  placeholder="Enter your name"
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm text-slate-200">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-pink/40"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-200">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-pink/40"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-brand-pink to-brand-purple px-4 py-3 font-semibold text-white"
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </button>

            <p className="text-sm text-slate-400">
              {isLogin ? "Need an account?" : "Already have an account?"}{" "}
              <Link to={isLogin ? "/signup" : "/login"} className="text-brand-pink">
                {isLogin ? "Sign up" : "Login"}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;