import React from "react";
import { Link, useParams } from "react-router-dom";
import { getHashtagPosts } from "../api";
import PagedPostGrid from "../components/PagedPostGrid";
import SafarLayout from "../components/SafarLayout";
import "../safargram.scss";

const TagPage = () => {
  const { tag } = useParams();
  return (
    <SafarLayout grid>
      <div className="sg-title">
        <Link to="/safargram">←</Link>
        <h2>#{tag}</h2>
      </div>
      <PagedPostGrid
        fetchPage={(cursor) => getHashtagPosts(tag, cursor)}
        deps={[tag]}
        emptyText={`No posts with #${tag} yet.`}
      />
    </SafarLayout>
  );
};

export default TagPage;
