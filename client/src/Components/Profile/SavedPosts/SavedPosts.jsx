import React, { useState } from 'react';
import { Bookmark, Image, Book, Map, Filter } from 'lucide-react';
import './SavedPosts.scss';

const SavedPosts = ({ savedItems, onRemove }) => {
    const [activeType, setActiveType] = useState('all');
    
    const categories = [
        { id: 'all', label: 'All Saved', icon: Bookmark },
        { id: 'photos', label: 'Photos', icon: Image },
        { id: 'blogs', label: 'Blogs', icon: Book },
        { id: 'tours', label: 'Tours', icon: Map }
    ];

    const filteredItems = activeType === 'all' 
        ? savedItems 
        : savedItems.filter(item => item.type === activeType);

    return (
        <div className="saved-posts">
            <div className="saved-header">
                <h2>Saved Items</h2>
                <div className="category-filters">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`category-btn ${activeType === category.id ? 'active' : ''}`}
                            onClick={() => setActiveType(category.id)}
                        >
                            <category.icon size={18} />
                            <span>{category.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="saved-grid">
                {filteredItems.map(item => (
                    <div key={item._id} className="saved-item">
                        <div className="item-image">
                            <img src={item.image} alt={item.title} />
                            <div className="item-type">{item.type}</div>
                        </div>
                        <div className="item-content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                            <div className="item-actions">
                                <button 
                                    className="remove-btn"
                                    onClick={() => onRemove(item._id, item.type)}
                                >
                                    Remove
                                </button>
                                <a href={item.link} className="view-btn">
                                    View
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="no-saved-items">
                    <Bookmark size={48} />
                    <h3>No saved items</h3>
                    <p>Items you save will appear here</p>
                </div>
            )}
        </div>
    );
};

export default SavedPosts;