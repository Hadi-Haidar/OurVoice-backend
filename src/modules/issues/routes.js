const express = require('express');
const router = express.Router();
const {
    createIssue,
    getAllIssues,
    getIssueById,
    toggleUpvote,
    addComment,
    updateComment,
    deleteComment,
    updateIssue,
    deleteIssue,
    updateIssueStatus,
    getCategories,
    uploadMedia
} = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

// Public routes
router.get('/', getAllIssues);
router.get('/categories', getCategories);
router.get('/:id', getIssueById);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes (lezem ykoun logged in)
router.post('/upload-media', protect, upload.single('file'), uploadMedia);//its role is to upload media to supabase
router.post('/', protect, upload.single('image_url'), createIssue);
router.patch('/:id', protect, upload.single('image_url'), updateIssue);
router.delete('/:id', protect, deleteIssue);
router.post('/:id/upvote', protect, toggleUpvote);
router.post('/:id/comments', protect, addComment);
router.patch('/:id/comments/:comment_id', protect, updateComment);
router.delete('/:id/comments/:comment_id', protect, deleteComment);
router.patch('/:id/status', protect, updateIssueStatus);

module.exports = router;

