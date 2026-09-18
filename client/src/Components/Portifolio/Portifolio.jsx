import React, {useEffect} from 'react';
import './Portifolio.scss';

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
        <section className="portfolio-section">
            <div className="portfolio-container">
                {/* Header Section */}
                <div className="portfolio-header" data-aos='fade-up'>
                    <div className="badge-why">
                        <span>✨ Why Choose Us</span>
                    </div>
                    
                    <h2 className="portfolio-title">
                        Why <span className="safar">Safar</span><span className="nama">Nama</span>?
                    </h2>
                    
                    <p className="portfolio-subtitle">
                        We connect eco-conscious travelers with sustainable destinations, ensuring unforgettable experiences that preserve nature. Choose us for responsible travel that leaves a positive impact on both the environment and local communities.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="features-grid-container">
                    <div className="features-grid">
                        <div className="feature-card" data-aos='fade-right'>
                            <div className="feature-icon">
                                <img src={icon1} alt="Safety Icon"/>
                            </div>

                            <div className="feature-info">
                                <h3>Safety & Support</h3>
                                <p>
                                    Your safety is our top priority with trusted travel guides and 24/7 support. We ensure a secure, worry-free journey while you explore nature responsibly.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card" data-aos='fade-up' data-aos-delay="100">
                            <div className="feature-icon">
                                <img src={icon2} alt="Destinations Icon"/>
                            </div>

                            <div className="feature-info">
                                <h3>Diverse Range of Destinations</h3>
                                <p>
                                    We offer a diverse range of eco-friendly destinations, from serene landscapes to hidden cultural gems. Explore unique experiences tailored to every type of traveler.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card" data-aos='fade-left' data-aos-delay="200">
                            <div className="feature-icon">
                                <img src={icon3} alt="Support Icon"/>
                            </div>

                            <div className="feature-info">
                                <h3>24/7 Customer Support</h3>
                                <p>
                                    Our dedicated team is available 24/7 to assist you with any travel queries or concerns. Enjoy seamless support throughout your eco-tourism journey with SafarNama.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Image beside features */}
                    <div className="portfolio-image" data-aos='fade-left'>
                        <div className="image-wrapper">
                            <img src={image} alt="Travel Experience"/>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Portifolio;