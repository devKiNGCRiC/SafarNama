import React, { useState } from 'react';
import "./Feedback.css";
//import Navbar from '../../Components/Navbar/Navbar';

const Feedback = () => {
    const [feedbackData, setFeedbackData] = useState({
        name: '',
        email: '',
        feedback: '',
        rating: '5',
    });

    const handleChange = (e) => {
        setFeedbackData({ ...feedbackData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('http://localhost:5000/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                setFeedbackData({ name: '', email: '', feedback: '', rating: '5' });
            })
            .catch(error => console.error('Error:', error));
    };

    return (
        <div className='feedback'>
            {/* <Navbar /> */}
            <div className="feedback-container">
            
            <h1 className='h1'>We Value Your Feedback!</h1>
            <p className='p'>Please fill out the form below to share your experience with us:</p>

            <form onSubmit={handleSubmit} className='forms'>
                <label htmlFor="name" className='label'>Name:</label>
                <input
                    type="text"
                    className='inputs'
                    id="name"
                    name="name"
                    value={feedbackData.name}
                    onChange={handleChange}
                    placeholder="Your name..."
                    required
                />

                <label htmlFor="email" className='label'>Email:</label>
                <input
                    type="email"
                    className='inputs'
                    id="email"
                    name="email"
                    value={feedbackData.email}
                    onChange={handleChange}
                    placeholder="Your email..."
                    required
                />

                <label htmlFor="feedback" className='label'>Your Feedback:</label>
                <textarea
                    id="feedback"
                    className='textarea'
                    name="feedback"
                    value={feedbackData.feedback}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Write your feedback here..."
                    required
                ></textarea>

                <label htmlFor="rating" className='label'>Rate Us:</label>
                <select
                    id="rating"
                    name="rating"
                    value={feedbackData.rating}
                    onChange={handleChange}
                >
                    <option value="5">Excellent</option>
                    <option value="4">Very Good</option>
                    <option value="3">Good</option>
                    <option value="2">Fair</option>
                    <option value="1">Poor</option>
                </select>

                <button type="submit" className="feedback_button">Submit Feedback</button>
            </form>
            </div>
        </div>
    );
};

export default Feedback;
