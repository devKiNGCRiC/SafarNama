import { useState } from 'react';
import React , {useEffect} from 'react';
import './Questions.css';
import Accordion from './Accordion';


//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'

const Questions = () => {
    useEffect(() => {
        Aos.init({duration: 2000})
    }, [])

    const [active, setActive] = useState("title1", "title2");


    return (
        <div className="questions section container">
            <div className="secHeading" data-aos = 'fade-up'>
                <h3>Frequently Asked Questions</h3>
            </div>
            <div className="secContainer grid">
                {/*we will import a component from a differnt file*/}
                <div className="accordion grid" data-aos = 'fade-up'>
                    <Accordion title= "How do I choose the right travel destination for me?" desc="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem." 
                        active= {active} setActive={setActive}  data-aos = 'fade-up'/>
                    
                    <Accordion title= "What are the Best time to visit Spiti Valley?" desc="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem." 
                        active= {active} setActive={setActive} data-aos = 'fade-up'/>

                    <Accordion title= "Is The Kedarnath trek Very Difficult?" desc="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem." 
                        active= {active} setActive={setActive} data-aos = 'fade-up'/>

                    <Accordion title= "Where is Valley of Flowers located?" desc="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem." 
                        active= {active} setActive={setActive} data-aos = 'fade-up'/>
                </div>

                <div className="form" >
                    <div className="secHeading" data-aos = 'fade-up'>
                        <h4 data-aos = 'fade-up'>Do you have any questions?</h4>
                        <p data-aos = 'fade-up'>Please fill the form below and our dedicated team will get intouch with you as soon as possible.</p>
                    </div>

                    <div className="formContent grid" data-aos = 'fade-up'>
                        <input type="email" placeholder='Enter email address' data-aos = 'fade-up'/>
                        <textarea  placeholder='Enter your Question Here' data-aos = 'fade-up'></textarea>
                        <button className='btn' data-aos = 'fade-up'>Submit Inquiry</button>
                    </div>

                </div>
            </div>
           
        </div>
    );
};

export default Questions;