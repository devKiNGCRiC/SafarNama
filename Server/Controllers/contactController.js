import Contact from '../Models/Contact.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value) => (typeof value === 'string' ? value.trim() : '');

// Public "contact us" form. Everything must be plain text of a sensible size.
export const addContact = async (req, res) => {
  const firstName = clean(req.body?.firstName);
  const lastName = clean(req.body?.lastName);
  const email = clean(req.body?.email);
  const phone = clean(req.body?.phone);
  const message = clean(req.body?.message);

  if (!firstName || !lastName || !email || !phone || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (firstName.length > 60 || lastName.length > 60 || phone.length > 30) {
    return res.status(400).json({ message: 'Name or phone number is too long' });
  }
  if (email.length > 254 || !EMAIL.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ message: 'Your message can be at most 2000 characters' });
  }

  try {
    await new Contact({ firstName, lastName, email, phone, message }).save();
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
};
