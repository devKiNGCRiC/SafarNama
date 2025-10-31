import React, { lazy, Suspense } from "react";
import "./HomePage.css";

// Critical above-the-fold components (load immediately)
import Navbar from "../../Components/Navbar/Navbar";
import Sidebar from "../../Components/Sidebar/Sidebar";
import Home from "../../Components/Home/Home";

// Lazy load below-the-fold components
const Destinations = lazy(() =>
  import("../../Components/Destinations/Destinations")
);
const Footer = lazy(() => import("../../Components/Footer/Footer"));
const Middle = lazy(() => import("../../Components/Middle/Middle"));
const Portifolio = lazy(() => import("../../Components/Portifolio/Portifolio"));
const Questions = lazy(() => import("../../Components/Questions/Questions"));
const Review = lazy(() => import("../../Components/Review/Review"));
const Subscribe = lazy(() => import("../../Components/Subscribe/Subscribe"));

const HomePage = () => {
  return (
    <div className="HomePage">
      <Navbar />
      <Sidebar />
      <Home />
      <Suspense fallback={<div className="lazy-loading">Loading...</div>}>
        <Middle />
        <Destinations />
        <Portifolio />
        <Review />
        <Questions />
        <Subscribe />
        <Footer />
      </Suspense>
    </div>
  );
};

export default HomePage;
