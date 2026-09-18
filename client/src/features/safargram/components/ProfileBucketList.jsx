import React from "react";
import { getSaved } from "../api";
import PagedPostGrid from "./PagedPostGrid";

const ProfileBucketList = () => (
  <PagedPostGrid
    fetchPage={(cursor) => getSaved(cursor)}
    deps={[]}
    emptyText="Your Bucket List is empty. Tap “Add to Bucket List” on any post."
  />
);

export default ProfileBucketList;
