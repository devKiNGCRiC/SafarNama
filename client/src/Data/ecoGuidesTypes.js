// src/data/ecoGuideTypes.js
export const guideCategories = {
    SUSTAINABLE_TIPS: {
      id: 'SUSTAINABLE_TIPS',
      label: 'Sustainable Tips',
      icon: '💡',
      description: 'Tips for eco-friendly travel'
    },
    BEST_PRACTICES: {
      id: 'BEST_PRACTICES',
      label: 'Best Practices',
      icon: '✅',
      description: 'Guidelines for responsible tourism'
    },
    LOCAL_GUIDE: {
      id: 'LOCAL_GUIDE',
      label: 'Local Guide',
      icon: '🗺️',
      description: 'Local insights and recommendations'
    }
  };
  
  export const sampleGuides = [
    {
      _id: '1',
      title: 'Sustainable Packing Guide',
      category: 'SUSTAINABLE_TIPS',
      content: 'Learn how to pack efficiently while minimizing environmental impact.',
      author: {
        _id: '1',
        name: 'Eco Expert'
      },
      images: ['/images/sustainable-packing.jpg'],
      tags: ['packing', 'sustainable', 'travel-tips'],
      likes: [],
      comments: []
    },
    // Add more sample guides...
  ];