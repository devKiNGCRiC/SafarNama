import React from "react";

//Imported icons
import { BsArrowDownCircleFill } from "react-icons/bs";
import { BsArrowUpCircleFill } from "react-icons/bs";

const Accordion = ({ title, desc, active, setActive }) => {
  return (
    <div className="accordionContainer">
      <div
        className={(active === title ? "activeTitle" : "") + " title flex"}
        onClick={() => setActive(active === title ? null : title)}
      >
        <span style={{ flex: 1 }}>{title}</span>
        <span>
          {active === title ? (
            <BsArrowDownCircleFill className="icon" />
          ) : (
            <BsArrowUpCircleFill className="icon" />
          )}
        </span>
      </div>
      <div className={(active === title ? "show" : "") + " description "}>
        {desc}
      </div>
    </div>
  );
};

export default Accordion;
