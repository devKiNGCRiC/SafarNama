import React, { useState } from 'react';
import './contact.css';
import Navbar from "../../Components/Navbar/Navbar";
import Footer from '../../Components/Footer/Footer';
import { API_URL } from '../../config/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitting form data:", formData);

    fetch(`${API_URL}/api/v1/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from server:", data);
        alert(data.message);

        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: '',
        });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  return (
    <div>
      <Navbar />
      <section id="section-wrapper">
        <div className="box-wrapper">
          <div className="info-wrap">
            <h2 className="info-title">Contact Information</h2>
            <h3 className="info-sub-title">Fill up the form and our Team will get back to you within 24 hours</h3>
            <ul className="info-details">
              <li><i className="fas fa-phone-alt"></i> <a href="tel:+1235235598">+ 1235 2355 98</a></li>
              <li><i className="fas fa-paper-plane"></i> <a href="mailto:safarnama252935@gmail.com">safarnama252935@gmail.com</a></li>
              <li><i className="fas fa-globe"></i> <a href="#">yoursite.com</a></li>
            </ul>
            <ul className="social-icons">
              <li><a href="https://www.facebook.com/profile.php?id=61567204745011"><i className="fab fa-facebook"></i></a></li>
              <li><a href="https://www.threads.net/@safarnama_rkcbharat?invite=0"><i className="fab fa-twitter"></i></a></li>
              <li><a href="https://www.instagram.com/safarnama_rkcbharat"><i className="fab fa-instagram"></i></a></li>
            </ul>
          </div>
          
          <div className="form-wrap">
            <form onSubmit={handleSubmit}>
              <h2 className="form-title">Send us a message</h2>
              <div className="form-fields">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Mail"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    name="phone"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    placeholder="Write your message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
              </div>
              <input type="submit" value="Send Message" className="submit-button" />
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;
