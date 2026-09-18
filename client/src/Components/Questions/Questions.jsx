import { useState } from "react";
import React, { useEffect } from "react";
import "./Questions.scss";
import Accordion from "./Accordion";

//Importing Aos
import Aos from "aos";
import "aos/dist/aos.css";

const Questions = () => {
  useEffect(() => {
    Aos.init({ duration: 2000 });
  }, []);

  const [active, setActive] = useState(null);

  const faqs = [
    {
      title: "How do I choose the right travel destination for me?",
      desc: "Consider your interests, budget, available time, and travel style. Our travel experts can help you find destinations that match your preferences, whether you're seeking adventure, relaxation, cultural experiences, or nature exploration.",
    },
    {
      title: "What are the best times to visit Spiti Valley?",
      desc: "The best time to visit Spiti Valley is from May to October when the weather is pleasant and roads are accessible. Summer months (May-June) offer mild temperatures, while September-October provides clear skies and beautiful autumn colors.",
    },
    {
      title: "Is the Kedarnath trek very difficult?",
      desc: "The Kedarnath trek is moderate in difficulty, covering 16 km from Gaurikund. It requires basic fitness and acclimatization. Helicopter services and pony rides are available for those who prefer alternatives. We recommend proper preparation and consulting with our travel advisors.",
    },
    {
      title: "Where is Valley of Flowers located?",
      desc: "The Valley of Flowers is located in Uttarakhand's Chamoli district, within the Nanda Devi Biosphere Reserve. It's a UNESCO World Heritage Site, situated at an altitude of 3,658 meters, accessible via a trek from Govindghat through Ghangaria.",
    },
    {
      title: "Do I need travel insurance?",
      desc: "Yes, we strongly recommend travel insurance for all trips. It covers medical emergencies, trip cancellations, lost luggage, and other unforeseen circumstances. We can help you choose the right coverage based on your destination and activities.",
    },
    {
      title: "What documents do I need for domestic travel?",
      desc: "For domestic travel in India, you'll need a valid government-issued photo ID (Aadhar Card, Passport, Driving License, or Voter ID). Additional permits may be required for certain regions like Sikkim, Ladakh, or protected areas.",
    },
  ];

  return (
    <div className="questions section container">
      <div className="secHeading" data-aos="fade-up">
        <span className="redText">❓ FAQ</span>
        <h3>Frequently Asked Questions</h3>
        <p className="subtitle">
          Find answers to common questions about traveling with SafarNama
        </p>
      </div>
      <div className="secContainer grid">
        {/* FAQ Accordion */}
        <div className="accordion grid">
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              title={faq.title}
              desc={faq.desc}
              active={active}
              setActive={setActive}
            />
          ))}
        </div>

        {/* Contact Form */}
        <div className="form">
          <div className="secHeading" data-aos="fade-up">
            <h4>Still Have Questions?</h4>
            <p>
              Fill out the form below and our dedicated team will get in touch
              with you as soon as possible.
            </p>
          </div>

          <div className="formContent grid" data-aos="fade-up">
            <input type="text" placeholder="Your Name" />
            <input type="email" placeholder="Your Email Address" />
            <textarea
              placeholder="Ask your question here..."
              rows="5"
            ></textarea>
            <button className="btn">Submit Question</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questions;
