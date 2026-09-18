import React from "react";
import { Link } from "react-router-dom";
import { splitCaption } from "../utils/captionParts";

// Renders plain text plus #hashtag links. Nothing is ever injected as HTML.
const CaptionText = ({ text }) => (
  <>
    {splitCaption(text).map((part, i) =>
      part.type === "tag" ? (
        <Link key={i} className="sg-tag" to={`/safargram/tag/${part.value.toLowerCase()}`}>
          #{part.value}
        </Link>
      ) : (
        <React.Fragment key={i}>{part.value}</React.Fragment>
      ),
    )}
  </>
);

export default CaptionText;
