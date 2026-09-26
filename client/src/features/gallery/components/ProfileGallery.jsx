import React from "react";
import { getPhotos } from "../api";
import PhotoGrid from "./PhotoGrid";
import "../gallery.scss";

// The "Gallery" tab on a profile: that person's photos. Only the owner sees "Add photo".
const ProfileGallery = ({ username, isOwnProfile }) => (
  <PhotoGrid
    fetchPage={(cursor) => getPhotos({ user: username, cursor })}
    deps={[username]}
    canUpload={isOwnProfile}
    emptyTitle="No photos yet"
    emptyText={isOwnProfile ? "Share your eco-tourism adventures with photos." : "This traveller has not shared any photos yet."}
  />
);

export default ProfileGallery;
