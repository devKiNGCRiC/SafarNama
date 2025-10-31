import React, {useEffect} from 'react';
import './Portifolio.css';

//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'

//Imported Assets
import icon1 from '../../Assets/Safe.png';
import icon2 from '../../Assets/destination.png';
import icon3 from '../../Assets/customer-support.png';
import image from '../../Assets/gridImage.png';

const Portifolio = () => {
    useEffect(() => {
        Aos.init({duration: 2000})
    }, [])
    return (
        <div className="portifolio section container">
            <div className="secContainer grid">
                <div className="leftContent">
                    <div className="secHeading" data-aos = 'fade-up'>
                        <h3>Why Should You Choose Us</h3>
                        <p>We connect eco-conscious travelers with sustainable destinations, ensuring unforgettable experiences that preserve nature. Choose us for responsible travel that leaves a positive impact on both the environment and local communities."</p>
                    </div>

                    <div className="grid">
                        <div className="singlePortifolio flex">
                            <div className="iconDiv" data-aos = 'fade-up'>
                                <img src = {icon1} alt = "Icon Image"/>
                            </div>

                            <div className="info" data-aos = 'fade-up'>
                                <h4>Safety & Support</h4>
                                <p>
                                    Your safety is Our top Priority with trusted travel guides and 24/7 support. We ensure a secure, worry-free journey while you explore nature responsibly.
                                </p>
                            </div>
                        </div>

                        <div className="singlePortifolio flex">
                            <div className="iconDiv" data-aos = 'fade-up'>
                                <img src = {icon2} alt = "Icon Image"/>
                            </div>

                            <div className="info" data-aos = 'fade-up'>
                                <h4>Diverse Range of Destinations</h4>
                                <p>
                                    We offers a diverse range of eco-friendly destinations, from serene landscapes to hidden cultural gems. Explore unique experiences tailored to every type of traveler.
                                </p>
                            </div>
                        </div>

                        <div className="singlePortifolio flex">
                            <div className="iconDiv" data-aos = 'fade-up'>
                                <img src = {icon3} alt = "Icon Image"/>
                            </div>

                            <div className="info" data-aos = 'fade-up'>
                                <h4>24/7 Customer Support</h4>
                                <p>
                                Our dedicated team is available 24/7 to assist you with any travel queries or concerns. Enjoy seamless support throughout your eco-tourism journey with Safarnama.
                                </p>
                            </div>
                        </div>


                    </div>
                </div>

                <div className="rightContent" data-aos = 'fade-up'>
                    <img src={image} alt= "Image"/>
                </div>
            </div>
        </div>
    );
};

export default Portifolio;