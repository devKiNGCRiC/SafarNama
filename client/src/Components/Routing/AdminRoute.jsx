import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Only for admins: logged-out visitors go to sign-in (and come back after), everyone else to Home.
// (The server checks the role too - this just avoids showing screens that would only error.)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (user?.role !== "admin") return <Navigate to="/home" replace />;
  return children;
};

export default AdminRoute;
