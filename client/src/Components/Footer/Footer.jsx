import React , {useEffect} from 'react';
import './Footer.css';

import { Link } from 'react-router-dom';

//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'

//Imported icons
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { FaWhatsapp } from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";

import logo from '../../assets/logo.jpg';

const Footer = () => {

    useEffect(() => {
        Aos.init({duration: 2000})
    }, [])
    return (
        <div className="footer">
            <div className="setContainer container grid" >
                <div className="logoDiv">
                    <div className="footerLogo">
                        <img src = {logo} className="logoimg"/>
                        <span className='first'>Safar<span className='second'>Nama</span></span>
                    </div>
                    <div className ="copyright">
                        <p>© 2024 Safarnama | Part of <span className="rkc-bharat">RKC Bharat</span></p>
                    </div>

                    <div className="socials flex">
                        <a href='https://www.facebook.com/profile.php?id=61567204745011' ><FaFacebook className='icon'/></a>
                        <a href='https://www.instagram.com/safarnama_rkcbharat' ><FaInstagram className='icon'/></a>
                        <a href='https://x.com/Safarnama_RKC' ><BsTwitterX className='icon'/></a>
                        <a href='https://www.whatsapp.com/channel/0029VajfQckBvvsfzSX66q0Z'><FaWhatsapp className='icon'/></a>
                        <a href='https://www.threads.net/@safarnama_rkcbharat?invite=0' ><FaThreads className='icon'/></a>
                        <a href="https://t.me/SafarNama_RKCBharat" ><FaTelegramPlane className='icon'/></a>
                    </div>
                </div>
                

                <div className="footerLinks">
                    <span className="linkTitle">Information</span>
                        <li><a href='/'>Home</a></li>
                        <li><Link to ='/communityforum' >Community Forum</Link></li>
                        <li><Link to ='/events' >Event</Link></li>
                        {/* <li><a href='#'>Explore</a></li>
                        <li><a href='#'>Travel</a></li> */}
                        <li><Link to ='/blogs' >Blog</Link></li>
                        <li><Link to ='/feedback' >Feedback</Link></li>
                </div>

                <div className="footerLinks">
                    <span className="linkTitle">Helpfull Links</span>
                    <li><Link to ='/itinerary' >Itinerar Builder</Link></li>
                        {/* <li><a href='#'>Support</a></li> */}
                        <li><Link to ='/FAQ' >FAQ</Link></li>
                        {/* <li><a href='#'>Travel & Condition</a></li>
                        <li><a href='#'>Privacy</a></li> */}
                        <li><Link to ='/contact-Us' >Contact Us</Link></li>
                        {/* <li><Link to ='/eco-guides' >Eco Guides</Link></li> */}
                </div>

                <div className="footerLinks">
                    <span className="linkTitle">Contact Details</span>
                    <span className="Phone">+91 8732093825</span>
                    <span className="email">safarnama252935@gmail.com</span>
                </div>
            </div>
        </div>
    );
};

export default Footer;