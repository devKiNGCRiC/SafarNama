import React from "react";
import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { getSaved } from "../api";
import PagedPostGrid from "../components/PagedPostGrid";
import SafarLayout from "../components/SafarLayout";
import "../safargram.scss";

const BucketListPage = () => (
  <SafarLayout grid>
    <div className="sg-title">
      <Link to="/safargram">←</Link>
      <h2><Bookmark size={20} /> My Bucket List</h2>
    </div>
    <PagedPostGrid
      fetchPage={(cursor) => getSaved(cursor)}
      deps={[]}
      emptyText="Your Bucket List is empty. Tap “Add to Bucket List” on any post."
    />
  </SafarLayout>
);

export default BucketListPage;
