import React from "react";
import "../safargram.scss";

const Wordmark = ({ size }) => (
  <span className="sg-wordmark" style={size ? { fontSize: size } : undefined}>
    <span className="safar">Safar</span>
    <span className="gram">Gram</span>
  </span>
);

export default Wordmark;
