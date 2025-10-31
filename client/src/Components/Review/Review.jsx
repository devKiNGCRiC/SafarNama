import React , {useEffect} from 'react';
import './Review.css';

//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'

//Imported icons
import { FaStar } from "react-icons/fa";

//imported images
import image from '../../Assets/chandratal-lake.jpg';
import image2 from '../../Assets/intro1.jpg';
import image3 from '../../Assets/chandratal-lake.jpg';

const Review = () => {
    useEffect(() => {
        Aos.init({duration: 2000})
    }, [])
    return (
        <div className="reviews section container">
            <div className="secContainer grid">
                <div className="textDiv">
                    <span className="redText" data-aos = 'fade-up'>FROM OUR USERS</span>
                    <h3 data-aos = 'fade-up'>Real Travel Dairy From Our Beloved Users</h3>
                    <p data-aos = 'fade-up'>
                        By choosing us as their travel partner, users can expect an enhanced travel experience, 
                        with a wide range of destinations, flexible booking options, and personalized service. 
                        The website provides detailed information about each destination, including attractions, 
                        accommodations, and transportation options. Users can book their tickets online, and Discover hidden gems, connect with like-minded travelers, and create unforgettable memories with Safarnama.
                    </p>
                    <br/>
                    <span className="stars" data-aos = 'fade-up'>
                        <FaStar className="icon"/>
                        <FaStar className="icon"/>
                        <FaStar className="icon"/>
                        <FaStar className="icon"/>
                        <FaStar className="icon"/>
                    </span>
                    <br/><br/>
                    <div className="clientsImages flex" data-aos = 'fade-up'>
                        <img src={image} alt="" />
                        <img src={image2} alt="" />
                        <img src={image3} alt="" />
                    </div>
                </div>

                <div className="imgDiv" data-aos = 'fade-up'>
                    {/* image of person who reviewed */}
                    <img src={image} alt="Div Image" />
                </div>
            </div>
            
        </div>
    );
};

export default Review;