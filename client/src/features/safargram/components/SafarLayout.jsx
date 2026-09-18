import React from "react";
import ProfileRail from "./ProfileRail";
import TrendingPanel from "./TrendingPanel";
import "../safargram.scss";

// One frame for every SafarGram page.
//  - under 1024px: a single centred column (the rails are hidden)
//  - 1024px and up: profile rail | content | trending rail
// `grid` pages (hashtag, destination, Bucket List) are allowed to be wider on tablets.
const SafarLayout = ({ children, grid = false }) => (
  <div className="sg-page">
    <div className={`sg-shell ${grid ? "grid" : ""}`}>
      <aside className="sg-rail" aria-label="Your SafarGram">
        <ProfileRail />
      </aside>
      <main className={`sg-main ${grid ? "grid" : ""}`}>{children}</main>
      <aside className="sg-rail" aria-label="Trending">
        <TrendingPanel />
      </aside>
    </div>
  </div>
);

export default SafarLayout;
