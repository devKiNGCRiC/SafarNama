import React from 'react'

//Imported icons
import { BsArrowDownCircleFill } from "react-icons/bs";
import { BsArrowUpCircleFill } from "react-icons/bs";

const Accordion = ({title , desc , active , setActive}) => {



  return (
    <div className="accordionContainer">
        <span className={(active === title ? 'activeTitle' : "") + " title " + "flex"}>
            {title}
            <span onClick={() => setActive(title)}>
                {active === title ? <BsArrowDownCircleFill className="icon" /> : <BsArrowUpCircleFill className="icon rotate" />}   
            </span> 
        </span>
        <p className={(active === title ? 'show' : "") + " description "}>
            {desc}
        </p>
    </div>
  )
}

export default Accordion
