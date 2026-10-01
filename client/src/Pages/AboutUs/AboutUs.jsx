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
          <li className='li'><strong>Itinerary Planner:</strong> Tell us how many days you have and what you enjoy, and get a day-by-day route built from our destinations that you can edit and save.</li>
          <li className='li'><strong>Interactive Map-Based Platform:</strong> Explore eco-tourism destinations and their details on an interactive map.</li>
          <li className='li'><strong>SafarGram Community:</strong> Share photos and stories from your trips, and follow fellow eco-travellers.</li>
          <li className='li'><strong>Community Forum:</strong> Ask questions and swap advice with other travellers.</li>
          <li className='li'><strong>Eco-Guides:</strong> Practical tips on sustainable tourism practices and reducing your environmental impact.</li>
          <li className='li'><strong>Off-Beat Eco-Tourism Areas:</strong> Discover hidden gems and lesser-known destinations.</li>
          <li className='li'><strong>Events:</strong> Find and register for local eco-tourism events, including community clean-up drives.</li>
          <li className='li'><strong>Local Culture and Traditions:</strong> Read about regional festivals, traditions and local cuisines on each destination's page.</li>
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
