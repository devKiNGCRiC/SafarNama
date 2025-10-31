import React , {useEffect} from 'react';
import './Subscribe.css';

//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'

//Import images
import image from '../../assets/gridImage.png';

const Subscribe = () => {
    useEffect(() => {
        Aos.init({duration: 2000})
    }, [])
    return (
        <div className="subscribe section container">
            <div className="secContainer grid" data-aos = 'fade-up'>
                {/* image of person on a phone */}
                <img src={image} alt=""/>

                <div className="textDiv" data-aos = 'fade-up'>
                    <h4 data-aos = 'fade-up'>
                        Best Way To Start Your Journey
                    </h4>
                    <p data-aos = 'fade-up'>
                        We offer personalized itineraries that go beyond the ordinary, creating unforgettable experiences for our customers.
                    </p>
                    <button className="btn" data-aos = 'fade-up'>Start Now</button>
                </div>
            </div>


            
        </div>
    );
};

export default Subscribe;