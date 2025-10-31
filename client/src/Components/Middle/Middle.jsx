import React , {useEffect} from 'react';
import './Middle.css';


//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'
    
const Middle = () => {

    useEffect(() => {
        Aos.init({duration: 2000})
    }, [])

    return (
        <div className ="middle section">
            <div className="secContainer container">
                <div className="grid">
                    <span className="flex" data-aos = 'fade-up'>
                        <h1>10</h1>
                        <p>World of Experience</p>
                    </span>
                    <span className="flex" data-aos = 'fade-up'>
                        <h1>20+</h1>
                        <p>Fine Destinations</p>
                    </span>
                    <span className="flex" data-aos = 'fade-up'>
                        <h1>2k+</h1>
                        <p>Traveller Reviews</p>
                    </span>
                    <span className="flex" data-aos = 'fade-up'>
                        <h1>4.8</h1>
                        <p>Overall Rating</p>
                    </span>
                </div>
            </div>
            <h1></h1>
        </div>
    );
};

export default Middle;