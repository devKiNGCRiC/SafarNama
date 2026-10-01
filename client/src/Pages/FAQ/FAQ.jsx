// src/Pages/FAQ/FAQ.jsx
import React, { useState } from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Footer from '../../Components/Footer/Footer';
import './FAQ.css';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeQuestion, setActiveQuestion] = useState(null);

  const faqData = {
    general: [
      {
        question: "What is eco-tourism?",
        answer: "Eco-tourism is responsible travel to natural areas that conserves the environment, sustains the well-being of local people, and involves interpretation and education."
      },
      {
        question: "How can I be a responsible eco-tourist?",
        answer: "Practice Leave No Trace principles, support local communities, minimize your carbon footprint, respect wildlife and cultural sites, and follow local guidelines."
      }
    ],
    booking: [
      {
        question: "Can I book a tour through SafarNama?",
        answer: "Tour booking is not available yet. In the meantime, you can browse destinations, build a day-by-day itinerary with our planner, and save it for your trip."
      },
      {
        question: "How do I register for an event?",
        answer: "Open the Events page, pick an upcoming event and press Register. You'll need to be logged in. You can cancel your registration any time before the event from the same page, as long as spots remain."
      }
    ],
    sustainability: [
      {
        question: "How do you ensure environmental protection?",
        answer: "Our Eco-Guides share practical tips from the community on travelling lightly, and many destinations list known sustainability initiatives. We don't operate tours ourselves, so the day-to-day choices are up to you and the operators you travel with."
      },
      {
        question: "What sustainable practices do you promote?",
        answer: "Our Eco-Guides and Community Forum cover things like reducing plastic use, choosing local businesses, and respecting wildlife and protected areas. Community-run clean-up events are also listed on the Events page when they're happening near you."
      }
    ]
  };

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'booking', label: 'Booking' },
    { id: 'sustainability', label: 'Sustainability' }
  ];

  const filterFAQs = () => {
    let filteredFAQs = [];
    
    Object.entries(faqData).forEach(([category, questions]) => {
      if (activeCategory === 'all' || activeCategory === category) {
        const filtered = questions.filter(q => 
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        filteredFAQs = [...filteredFAQs, ...filtered];
      }
    });
    
    return filteredFAQs;
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="faq-container">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about eco-tourism and our services</p>
        </div>

        <div className="faq-search">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="faq-list">
          {filterFAQs().map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeQuestion === index ? 'active' : ''}`}
              onClick={() => setActiveQuestion(activeQuestion === index ? null : index)}
            >
              <div className="question">
                <h3>{faq.question}</h3>
                <span className="toggle-icon">
                  {activeQuestion === index ? '−' : '+'}
                </span>
              </div>
              {activeQuestion === index && (
                <div className="answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FAQ;