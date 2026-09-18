import React from "react";
import { getUserPosts } from "../api";
import PagedPostGrid from "./PagedPostGrid";

const ProfileSafarGrid = ({ username }) => (
  <PagedPostGrid
    fetchPage={(cursor) => getUserPosts(username, cursor)}
    deps={[username]}
    emptyText="No SafarGram posts yet."
  />
);

export default ProfileSafarGrid;
