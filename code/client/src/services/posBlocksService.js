// Service to manage POS custom blocks configuration
// This ensures owner's customizations are shared across all users via database

import apiService from './api';

// Default blocks structure
const getDefaultBlocks = () => ({
    proteinTop: Array(3).fill(null),
    protein: Array(3).fill(null),
    toppings: Array(5).fill(null),
    extraProtein: Array(5).fill(null),
    snacks: Array(5).fill(null),
    drinks: Array(5).fill(null),
    categories: Array(9).fill(null)
});

// Cache for blocks to avoid repeated API calls
let blocksCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2000; // 2 seconds

// Get custom blocks from database
export const getCustomBlocks = async () => {
    try {
        // Use cache if recent
        const now = Date.now();
        if (blocksCache && (now - lastFetchTime) < CACHE_DURATION) {
            return blocksCache;
        }

        const response = await apiService.getPOSBlocks();
        if (response.success && response.data) {
            blocksCache = response.data;
            lastFetchTime = now;
            return response.data;
        }
    } catch (error) {
        console.error('Error loading custom blocks from API:', error);
    }

    // Return default structure if API call fails
    const defaultBlocks = getDefaultBlocks();
    blocksCache = defaultBlocks;
    return defaultBlocks;
};

// Save custom blocks to database (only owners can save)
export const saveCustomBlocks = async (blocks) => {
    try {
        // Validate blocks structure before saving
        if (!blocks || typeof blocks !== 'object') {
            console.error('Invalid blocks data provided');
            return false;
        }

        const response = await apiService.savePOSBlocks(blocks);
        if (response.success) {
            // Update cache
            blocksCache = response.data || blocks;
            lastFetchTime = Date.now();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving custom blocks:', error);
        return false;
    }
};

// Clear cache (useful when owner updates blocks)
export const clearBlocksCache = () => {
    blocksCache = null;
    lastFetchTime = 0;
};

// Update a specific block (async)
export const updateBlock = async (blockType, blockIndex, item) => {
    const blocks = await getCustomBlocks();
    blocks[blockType] = [...blocks[blockType]];
    blocks[blockType][blockIndex] = item;
    await saveCustomBlocks(blocks);
    return blocks;
};

// Clear a specific block (async)
export const clearBlock = async (blockType, blockIndex) => {
    const blocks = await getCustomBlocks();
    blocks[blockType] = [...blocks[blockType]];
    blocks[blockType][blockIndex] = null;
    await saveCustomBlocks(blocks);
    return blocks;
};

// Reset all blocks to default (async)
export const resetAllBlocks = async () => {
    const defaultBlocks = getDefaultBlocks();
    await saveCustomBlocks(defaultBlocks);
    clearBlocksCache();
    return defaultBlocks;
};

