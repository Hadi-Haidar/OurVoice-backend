const { supabaseAdmin } = require('../config/db');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // I need to check if uuid is installed, if not I'll use Date.now()

/**
 * Uploads a file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToSupabase = async (fileBuffer, fileName, mimeType) => {
    try {
        const bucketName = 'issue-media';

        // 1. Ensure bucket exists and is public
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (!buckets.find(b => b.name === bucketName)) {
            await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/*', 'video/*'],
                fileSizeLimit: 5242880 // 5MB
            });
        }

        // 2. Generate unique filename
        const ext = path.extname(fileName) || (mimeType.includes('video') ? '.mp4' : '.jpg');
        const uniqueName = `${uuidv4()}${ext}`;
        const filePath = `uploads/${uniqueName}`;

        // 3. Upload file
        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 4. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Storage Upload Error:', error);
        throw new Error('Failed to upload file to storage');
    }
};

module.exports = { uploadToSupabase };
