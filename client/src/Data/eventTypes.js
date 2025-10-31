// src/data/eventTypes.js
const eventTypes = {
    FESTIVAL: {
      id: 'FESTIVAL',
      label: 'Festival',
      icon: '🎉',
      description: 'Cultural celebrations and eco-friendly festivals'
    },
    ACTIVITY: {
      id: 'ACTIVITY',
      label: 'Activity',
      icon: '🏃‍♂️',
      description: 'Outdoor and adventure activities'
    },
    WORKSHOP: {
      id: 'WORKSHOP',
      label: 'Workshop',
      icon: '🎨',
      description: 'Educational workshops and training sessions'
    },
    CLEANUP: {
      id: 'CLEANUP',
      label: 'Clean-up Drive',
      icon: '🌿',
      description: 'Environmental clean-up and conservation activities'
    }
  };
  
  export const sampleEvents = [
    {
      _id: '1',
      title: 'Beach Clean-up Drive',
      type: 'CLEANUP',
      description: 'Join us for a community beach clean-up event to protect marine life.',
      startDate: '2024-12-15T09:00:00',
      endDate: '2024-12-15T12:00:00',
      location: {
        coordinates: [73.8567, 18.5204],
        address: 'Juhu Beach, Mumbai'
      },
      capacity: 50,
      registeredUsers: [],
      images: ['/images/beach-cleanup.jpg'],
      sustainabilityImpact: {
        description: 'Help remove plastic waste from our beaches and protect marine ecosystems.',
        metrics: {
          wasteCollected: '100kg average',
          areasCleaned: '2km shoreline'
        }
      }
    },
    // Add more sample events...
  ];

  export default eventTypes;
