import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export const processImage = async (filePath, options = {}) => {
    const {
        width = 800,
        height = 800,
        quality = 80,
        format = 'webp'
    } = options;

    try {
        const processedImage = sharp(filePath);

        // Resize if dimensions provided
        if (width || height) {
            processedImage.resize(width, height, {
                fit: 'cover',
                position: 'center'
            });
        }

        // Convert to WebP for better compression
        processedImage.webp({ quality });

        // Create new filename
        const dir = path.dirname(filePath);
        const filename = path.basename(filePath, path.extname(filePath));
        const newPath = path.join(dir, `${filename}.webp`);

        // Save processed image
        await processedImage.toFile(newPath);

        // Delete original file
        await fs.unlink(filePath);

        return newPath;
    } catch (error) {
        console.error('Image processing error:', error);
        throw error;
    }
};

export const calculateEcoScore = (profile) => {
    let score = 0;
    const { ecoStats } = profile;

    // Calculate score based on various factors
    score += ecoStats.treesPlanted * 10;
    score += ecoStats.volunteeredHours * 5;
    score += ecoStats.sustainableStays * 15;
    score -= ecoStats.carbonFootprint * 2;

    return Math.max(0, Math.round(score)); // Ensure non-negative score
};

export const generateAchievement = (type, value) => {
    const achievements = {
        treesPlanted: {
            10: {
                title: 'Seedling Guardian',
                description: 'Planted 10 trees',
                badge: 'seedling'
            },
            50: {
                title: 'Forest Creator',
                description: 'Planted 50 trees',
                badge: 'forest'
            }
        },
        volunteering: {
            10: {
                title: 'Community Helper',
                description: '10 hours of volunteering',
                badge: 'volunteer-bronze'
            },
            50: {
                title: 'Community Champion',
                description: '50 hours of volunteering',
                badge: 'volunteer-silver'
            }
        },
        sustainableStays: {
            5: {
                title: 'Eco Explorer',
                description: '5 sustainable accommodations',
                badge: 'eco-bronze'
            },
            20: {
                title: 'Sustainability Sage',
                description: '20 sustainable accommodations',
                badge: 'eco-gold'
            }
        }
    };

    return achievements[type]?.[value] || null;
};