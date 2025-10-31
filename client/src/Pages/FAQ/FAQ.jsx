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
        question: "How do I book an eco-tour?",
        answer: "You can book through our website by selecting your desired destination and following the booking process. Make sure you're logged in to your account."
      },
      {
        question: "What is your cancellation policy?",
        answer: "Our standard cancellation policy allows free cancellation up to 48 hours before the tour. Different terms may apply for special tours."
      }
    ],
    sustainability: [
      {
        question: "How do you ensure environmental protection?",
        answer: "We work with certified eco-friendly partners, implement waste reduction programs, support local conservation efforts, and educate visitors about environmental protection."
      },
      {
        question: "What sustainable practices do you follow?",
        answer: "We minimize plastic use, support local communities, use renewable energy where possible, and follow sustainable waste management practices."
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