import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

// requireLogin("reply") -> true when logged in; otherwise says so, sends the person to sign in
// (and back here afterwards) and returns false.
export default function useRequireLogin() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (what) => {
      if (isAuthenticated) return true;
      toast.error(`Please log in to ${what}`);
      navigate("/auth", { state: { from: location } });
      return false;
    },
    [isAuthenticated, navigate, location],
  );
}
