//Destination.jsx from Homepage
import React , {useState , useEffect} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Destinations.css';

//Importing Aos
import Aos from 'aos'
import 'aos/dist/aos.css'

//imported icons
import { MdLocationPin } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa6";
import { PiCalendarFill } from "react-icons/pi";
import { FcSearch } from "react-icons/fc";
import { TiLocation } from "react-icons/ti";

// //imported images
// import img1 from '../../Assets/chandratal-lake.jpg'
// import img2 from '../../Assets/intro1.jpg'
// import img3 from '../../Assets/chandratal-lake.jpg'
// import img4 from '../../Assets/chandratal-lake.jpg'
// import img5 from '../../Assets/chandratal-lake.jpg'
// import img6 from '../../Assets/chandratal-lake.jpg'
// import img7 from '../../Assets/chandratal-lake.jpg'
// import img8 from '../../Assets/chandratal-lake.jpg'

// //Lets Create an Array that is gonna contain all destination data and we loop through

// const destinations = [
//     {
//         id: 1,
//         img: img1,
//         name: 'Chandratal Lake',
//         location: 'Himachal Pradesh, India',
//         rating: 4.8,
//     },
//     {
//         id: 2,
//         img: img2,
//         name: 'Kedarnath',
//         location: 'Uttrakhand, India',
//         rating: 4.4,
//     },
//     {
//         id: 3,
//         img: img3,
//         name: 'Tawang',
//         location: 'Arunachal Pradesh, India',
//         rating: 4.6,
//     },
//     {
//         id: 4,
//         img: img4,
//         name: 'Dzukou',
//         location: 'Nagaland, India',
//         rating: 4.3,
//     },
//     {
//         id: 5,
//         img: img5,
//         name: 'Rann of Kutch',
//         location: 'Gujarat, India',
//         rating: 4.5,
//     },
//     {
//         id: 6,
//         img: img6,
//         name: 'Sundarbans Natioanl Park',
//         location: 'West Bengal, India',
//         rating: 4.1,
//     },
//     {
//         id: 7,
//         img: img7,
//         name: 'Ooty',
//         location: 'Tamil Nadu, India',
//         rating: 4.6,
//     },
//     {
//         id: 8,
//         img: img8,
//         name: 'Spiti Valley',
//         location: 'Himachal Pradesh, India',
//         rating: 4.8,
//     }
// ];

const Destinations = () => {
    const [destinations, setDestinations] = useState([]);
    const [filteredDestinations, setFilteredDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchParams, setSearchParams] = useState({
      location: '',
      budget: '',
      date: ''
    });
  
    useEffect(() => {
    
      Aos.init({duration: 2000});
      console.log('Fetching destinations...')
      fetchDestinations();
      
      // Check URL for search parameters
      const urlParams = new URLSearchParams(window.location.search);
      const locationParam = urlParams.get('location');
      if (locationParam) {
        setSearchParams(prev => ({ ...prev, location: locationParam }));
      }
    }, []);
    
    // Auto-search when URL location parameter is set
    useEffect(() => {
      if (searchParams.location && destinations.length > 0) {
        handleSearch();
      }
    }, [searchParams.location, destinations]);
  
    const fetchDestinations = async () => {
        try {
            console.log('Making API call...');
          const res = await axios.get('http://localhost:5000/api/v1/destinations/featured');
          console.log('API response:', res.data);
          if (res.data.success && Array.isArray(res.data.data)) {
            setDestinations(res.data.data);
            setFilteredDestinations(res.data.data);
          } else {
            throw new Error('Invalid data format received');
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching destinations:', error);
          console.error('Error message:', error.message);
            console.error('Error response:', error.response?.data); 
          setError(error.message);
          setLoading(false);
        }
      };
  
    const handleSearch = () => {
      let filtered = [...destinations];
      
      if (searchParams.location) {
        filtered = filtered.filter(dest => 
          dest.location?.toLowerCase().includes(searchParams.location.toLowerCase()) ||
          dest.name?.toLowerCase().includes(searchParams.location.toLowerCase()) ||
          dest.address?.toLowerCase().includes(searchParams.location.toLowerCase())
        );
      }
  
      setFilteredDestinations(filtered);
    };
  
    const handleCategoryChange = async (category) => {
        setActiveCategory(category);
        setLoading(true);
        try {
          let res;
          if (category === 'All') {
            res = await axios.get('http://localhost:5000/api/v1/destinations/featured');
          } else {
            res = await axios.get(`http://localhost:5000/api/v1/destinations/category/${category}`);
          }
          if (res.data.success && Array.isArray(res.data.data)) {
            setFilteredDestinations(res.data.data);
          }
        } catch (error) {
          console.error('Error filtering destinations:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;
// const Destinations = () => {
//     useEffect(() => {
//         Aos.init({duration: 2000})
//     }, [])
    return (
        <div className="destination section container">
            <div className="secContainer">
                <div className="secTitle" data-aos = 'fade-up'>
                    <span className="redText">Explore Now </span>
                    <h3>Find Your Dream Destinations</h3>
                    {/* <p>Fill in the fields below to find the best spot for your next tour.</p> */}
                </div>

                {/* <div className="searchField grid">
                    <div className="inputField flex" data-aos = 'fade-up'>
                        <MdLocationPin className="icon"/>
                        <input type="text" placeholder='Location' value={searchParams.location} onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}/>
                    </div>

                    <div className="inputField flex" data-aos = 'fade-up' >
                        <FaCreditCard className="icon"/>
                        <input type="text" placeholder='Budget' value={searchParams.budget} onChange={(e) => setSearchParams({...searchParams, budget: e.target.value})}/>
                    </div>

                    <div className="inputField flex" data-aos = 'fade-up'>
                        <PiCalendarFill className="icon"/>
                        <input type="text" placeholder='Date' value={searchParams.date} onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}/>
                    </div>

                    <button className = "btn flex" data-aos = 'fade-up' onClick={handleSearch}>
                        <FcSearch className = "icon"/> Search
                    </button>
                </div> */}

                <div className="secMenu">
                    <ul className="flex" data-aos = 'fade-up'>
                        {['All', 'Recommended', 'Mountain', 'Nature', 'Park', 'Beach'].map((category) => (
                        <li 
                            key={category}
                            className={activeCategory === category ? 'active' : ''}
                            onClick={() => handleCategoryChange(category)}
                        >
                            {category}
                        </li>
                        ))}
                    </ul>
                </div>

                <div className="destinationContainer grid">
                    {filteredDestinations.length > 0 ? (
                    filteredDestinations.map((destination) => (
                        <Link to={`/destinations/${destination._id}`} key={destination._id} className="destinationLink">
                        <div className="singleDestination">
                            <div className="imgDiv" data-aos="fade-up">
                            {destination.images && destination.images[0] && (
                                <img 
                                src={destination.images[0]} 
                                alt={destination.name} 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'path/to/fallback/image.jpg'; // Add a fallback image
                                }}
                                />
                            )}
                            <div className="descInfo flex">
                                <div className="text">
                                <span className="name">{destination.name}</span>
                                <p className="flex">
                                    <TiLocation className="icon"/>
                                    {destination.address}
                                </p>
                                </div>
                                <span className="rating">{destination.rating}</span>
                            </div>
                            </div>
                        </div>
                        </Link>
                    ))
                    ) : (
                    <div className="no-destinations">No destinations found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Destinations;