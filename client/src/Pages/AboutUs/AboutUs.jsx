// AboutUs.js
import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className='body2'>
      <header className="header2">
        <h1 className='h1'>About Us</h1>
        <p className='p'>Your Gateway to Responsible and Enriching Travel Experiences</p>
      </header>

      <section className="about-section">
        <h2 className='h2'>Who We Are</h2>
        <p className='p'>At Safarnama, we believe that every journey should not only be enjoyable but also meaningful and sustainable. Our mission is to provide eco-conscious travelers with a comprehensive platform that combines seamless trip planning with a commitment to protecting the environment and supporting local communities.</p>
      </section>

      <section className="features-section">
        <h2 className='h2'>What We Offer</h2>
        <ul className='ul'>
          <li className='li'><strong>Dynamic Booking System:</strong> We streamline your trip planning with a one-stop solution for booking accommodations and travel tickets.</li>
          <li className='li'><strong>Interactive Map-Based Platform:</strong> Explore eco-tourism destinations with real-time data and details.</li>
          <li className='li'><strong>Comprehensive Travel Planning System:</strong> Customize your trip to fit your passions and values.</li>
          <li className='li'><strong>Community-Driven Environment:</strong> Share your experiences with fellow eco-tourists.</li>
          <li className='li'><strong>Educational Resources:</strong> Learn about sustainable tourism practices and environmental impact.</li>
          <li className='li'><strong>Off-Beat Eco-Tourism Areas:</strong> Discover hidden gems and lesser-known destinations.</li>
          <li className='li'><strong>Real-Time Travel Assistance:</strong> Get live weather updates and route suggestions for safe, enjoyable journeys.</li>
          <li className='li'><strong>Local Culture and Traditions:</strong> Immerse yourself in regional festivals, traditions, and local cuisines.</li>
          <li className='li'><strong>Connecting with Nature:</strong> Participate in conservation efforts and engage with the environment.</li>
        </ul>
      </section>

      <section className="vision-section">
        <h2 className='h2'>Our Vision</h2>
        <p className='p'>Safarnama is more than just a travel platform – it’s a movement towards sustainable tourism. We aim to inspire travelers to explore the world responsibly, fostering a deeper connection with nature and local communities. Every journey you embark on with Safarnama is a step towards preserving the planet and promoting a better future for travel.</p>
      </section>
    </div>
  );
};

export default AboutUs;
