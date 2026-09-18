import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcSearch } from "react-icons/fc";
import { MdClose } from "react-icons/md";
import './Search.css'
import { API_URL } from '../../config/api';

const SearchComponent = ({ variant = 'navbar' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Make parallel requests to different endpoints
      const [destinationsRes, postsRes, blogsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/search/destinations?q=${searchTerm}`),
        fetch(`${API_URL}/api/v1/search/posts?q=${searchTerm}`),
        fetch(`${API_URL}/api/v1/search/blogs?q=${searchTerm}`)
      ]);

      const [destinations, posts, blogs] = await Promise.all([
        destinationsRes.json(),
        postsRes.json(),
        blogsRes.json()
      ]);

      setSearchResults({
        destinations: destinations.data || [],
        posts: posts.data || [],
        blogs: blogs.data || []
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchTerm('');
    
    switch(type) {
      case 'destination':
        navigate(`/destinations/${item._id}`);
        break;
      case 'post':
        navigate(`/posts/${item._id}`);
        break;
      case 'blog':
        navigate(`/blogs/${item._id}`);
        break;
      default:
        break;
    }
  };

  const baseClasses = variant === 'hero' 
    ? 'search-container hero-search'
    : 'search-container navbar-search';

  return (
    <div className={baseClasses} ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search destinations, posts, blogs..."
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-button"
            onClick={() => {
              setSearchTerm('');
              setShowResults(false);
            }}
          >
            <MdClose />
          </button>
        )}
        <button className="search-button" onClick={handleSearch}>
          <FcSearch />
        </button>
      </div>

      {showResults && (
        <div className="search-results">
          {isLoading ? (
            <div className="loading">Searching...</div>
          ) : (
            <>
              {searchResults.destinations?.length > 0 && (
                <div className="result-section">
                  <h3>Destinations</h3>
                  {searchResults.destinations.map(item => (
                    <div
                      key={item._id}
                      className="result-item"
                      onClick={() => handleResultClick('destination', item)}
                    >
                      <img src={item.images[0]} alt={item.name} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.posts?.length > 0 && (
                <div className="result-section">
                  <h3>Posts</h3>
                  {searchResults.posts.map(item => (
                    <div
                      key={item._id}
                      className="result-item"
                      onClick={() => handleResultClick('post', item)}
                    >
                      {item.image && <img src={item.image} alt={item.title} />}
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.blogs?.length > 0 && (
                <div className="result-section">
                  <h3>Blogs</h3>
                  {searchResults.blogs.map(item => (
                    <div
                      key={item._id}
                      className="result-item"
                      onClick={() => handleResultClick('blog', item)}
                    >
                      {item.image && <img src={item.image} alt={item.title} />}
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {!searchResults.destinations?.length && 
               !searchResults.posts?.length && 
               !searchResults.blogs?.length && (
                <div className="no-results">
                  No results found for "{searchTerm}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;