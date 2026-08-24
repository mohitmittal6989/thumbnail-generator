import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkStyles = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm transition ${
    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-wide text-white">
          <span className="gradient-text">AI-powered</span> Thumbnail Generator
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={linkStyles}>
            Home
          </NavLink>
          <NavLink to="/generate" className={linkStyles}>
            Generate
          </NavLink>
          <NavLink to="/my-generations" className={linkStyles}>
            My Generations
          </NavLink>
          <NavLink to="/community" className={linkStyles}>
            Community
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 sm:block">
                {user?.credits ?? 0} credits
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-brand-pink/40 hover:bg-brand-pink/10"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-brand-pink to-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;