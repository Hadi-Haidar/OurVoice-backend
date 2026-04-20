const { supabaseAdmin } = require('../../config/db');
const { uploadToSupabase } = require('../../utils/storage');

// @desc    Report a new issue (nbalegh 3an moshkle jdide)
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
    try {
        const { title, description, category_id, location_text, lat, lng, video_url, is_anonymous } = req.body;
        let { image_url } = req.body;

        if (!title || !description || !category_id || !location_text) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        // If a file was uploaded directly (multipart/form-data via Postman/Desktop)
        if (req.file) {
            image_url = await uploadToSupabase(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );
        }

        const { data: newIssue, error } = await supabaseAdmin.from('issues').insert({
            title,
            description,
            category_id,
            location_text,
            lat,
            lng,
            image_url,
            video_url,
            is_anonymous: is_anonymous || false,
            author_id: req.user.id
        }).select(`
            *,
            author:author_id (id, full_name),
            category:category_id (*)
        `).single();

        if (error) throw error;

        return res.status(201).json({ success: true, data: newIssue });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all issues with filters (njib kel el mashakel)
// @route   GET /api/issues
// @access  Public
const getAllIssues = async (req, res) => {
    try {
        const { category_id, status, search } = req.query;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const from  = (page - 1) * limit;
        const to    = from + limit - 1;

        let query = supabaseAdmin
            .from('issues')
            .select(`
                *,
                author:author_id (id, full_name),
                category:category_id (*),
                upvotes_count:issue_upvotes(count),
                comments_count:issue_comments(count)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (category_id && category_id !== 'all') {
            query = query.eq('category_id', category_id);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location_text.ilike.%${search}%`);
        }

        const { data: issues, error, count } = await query;

        if (error) throw error;

        // Optional: Check if current user has upvoted (mnshouf eza l user 3amel upvote)
        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                // Ignore invalid tokens for public route
            }
        }

        // 1. Get all upvotes for these issues by this user (if logged in)
        let userUpvotes = [];
        if (userId && issues.length > 0) {
            const issueIds = issues.map(i => i.id);
            const { data: userVotes } = await supabaseAdmin
                .from('issue_upvotes')
                .select('issue_id')
                .eq('user_id', userId)
                .in('issue_id', issueIds);
            userUpvotes = userVotes ? userVotes.map(v => v.issue_id) : [];
        }

        // Transform count objects into numbers and handle anonymity
        const transformedIssues = issues.map(issue => ({
            ...issue,
            upvotes: issue.upvotes_count[0]?.count || 0,
            has_upvoted: userUpvotes.includes(issue.id),
            comments: issue.comments_count[0]?.count || 0,
            upvotes_count: undefined,
            comments_count: undefined,
            author: issue.is_anonymous ? { id: null, full_name: 'Anonymous' } : issue.author
        }));

        return res.status(200).json({
            success: true,
            data: transformedIssues,
            pagination: {
                total: count || 0,
                page,
                limit,
                hasMore: to < (count - 1)
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get single issue details (njib ma3loumet moshkle wehde)
// @route   GET /api/issues/:id
// @access  Public
const getIssueById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: issue, error } = await supabaseAdmin
            .from('issues')
            .select(`
                *,
                author:author_id (id, full_name),
                category:category_id (*),
                comments:issue_comments (
                    id,
                    text,
                    created_at,
                    author:author_id (id, full_name)
                ),
                upvotes:issue_upvotes (
                    user_id
                )
            `)
            .eq('id', id)
            .single();

        if (error || !issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
        }

        // Transform data for easier frontend use
        const transformedIssue = {
            ...issue,
            upvotes_count: issue.upvotes.length,
            comments_count: issue.comments.length,
            has_upvoted: req.user ? issue.upvotes.some(v => v.user_id === req.user.id) : false,
            // also keep upvotes for backward compatibility or direct use if needed
            upvotes: issue.upvotes.length,
            author: issue.is_anonymous ? { id: null, full_name: 'Anonymous' } : issue.author 
        };

        return res.status(200).json({ success: true, data: transformedIssue });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Upvote/Unvote an issue (na3mel upvote aw nshilo)
// @route   POST /api/issues/:id/upvote
// @access  Private
const toggleUpvote = async (req, res) => {
    try {
        const { id: issue_id } = req.params;
        const user_id = req.user.id;

        // 1. Check if already upvoted
        const { data: existingUpvote } = await supabaseAdmin
            .from('issue_upvotes')
            .select('*')
            .eq('issue_id', issue_id)
            .eq('user_id', user_id)
            .single();

        if (existingUpvote) {
            // Unvote
            await supabaseAdmin
                .from('issue_upvotes')
                .delete()
                .eq('id', existingUpvote.id);

            return res.status(200).json({ success: true, message: 'Upvote removed', upvoted: false });
        } else {
            // Upvote
            const { error } = await supabaseAdmin
                .from('issue_upvotes')
                .insert({ issue_id, user_id });

            if (error) throw error;
            return res.status(201).json({ success: true, message: 'Upvote added', upvoted: true });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Add comment to issue (na3mel comment)
// @route   POST /api/issues/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { id: issue_id } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Comment text is required.' });
        }

        const { data: comment, error } = await supabaseAdmin
            .from('issue_comments')
            .insert({
                issue_id,
                author_id: req.user.id,
                text
            })
            .select(`
                *,
                author:author_id (id, full_name)
            `)
            .single();

        if (error) throw error;

        return res.status(201).json({ success: true, data: comment });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update a comment
// @route   PATCH /api/issues/:id/comments/:comment_id
// @access  Private
const updateComment = async (req, res) => {
    try {
        const { id: issue_id, comment_id } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Comment text is required.' });
        }

        // Check if comment exists and if user is author
        const { data: comment, error: findError } = await supabaseAdmin
            .from('issue_comments')
            .select('author_id')
            .eq('id', comment_id)
            .eq('issue_id', issue_id)
            .single();

        if (findError || !comment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        if (comment.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this comment.' });
        }

        // Update comment
        const { data: updatedComment, error } = await supabaseAdmin
            .from('issue_comments')
            .update({ text })
            .eq('id', comment_id)
            .select(`
                *,
                author:author_id (id, full_name)
            `)
            .single();

        if (error) throw error;

        return res.status(200).json({ success: true, data: updatedComment });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/issues/:id/comments/:comment_id
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const { id: issue_id, comment_id } = req.params;

        // Check if comment exists and if user is author
        const { data: comment, error: findError } = await supabaseAdmin
            .from('issue_comments')
            .select('author_id')
            .eq('id', comment_id)
            .eq('issue_id', issue_id)
            .single();

        if (findError || !comment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        if (comment.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
        }

        // Delete comment
        const { error } = await supabaseAdmin
            .from('issue_comments')
            .delete()
            .eq('id', comment_id);

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Comment deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update single issue (na3mel update lal moshkle)
// @route   PATCH /api/issues/:id
// @access  Private (Author only)
const updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category_id, location_text, lat, lng, video_url } = req.body;
        let { image_url } = req.body;

        // If a file was uploaded directly
        if (req.file) {
            image_url = await uploadToSupabase(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );
        }

        // 1. Mnshouf eza l moshkle mawjoude w eza l user huwe l author
        const { data: issue, error: findError } = await supabaseAdmin
            .from('issues')
            .select('author_id')
            .eq('id', id)
            .single();

        if (findError || !issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
        }

        if (issue.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to edit this issue.' });
        }

        // 2. Mna3mel update
        const { data: updatedIssue, error: updateError } = await supabaseAdmin
            .from('issues')
            .update({
                title,
                description,
                category_id,
                location_text,
                lat,
                lng,
                image_url,
                video_url,
                // created_at avoids being updated by default but good to be careful
            })
            .eq('id', id)
            .select(`
                *,
                author:author_id (id, full_name),
                category:category_id (*)
            `)
            .single();

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, data: updatedIssue });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete single issue (nam7le l moshkle)
// @route   DELETE /api/issues/:id
// @access  Private (Author only)
const deleteIssue = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Mnshouf eza l moshkle mawjoude w eza l user huwe l author
        const { data: issue, error: findError } = await supabaseAdmin
            .from('issues')
            .select('author_id')
            .eq('id', id)
            .single();

        if (findError || !issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
        }

        if (issue.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this issue.' });
        }

        // 2. Nam7le (Cascade deletes comments and upvotes due to DB schema)
        const { error: deleteError } = await supabaseAdmin
            .from('issues')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return res.status(200).json({ success: true, message: 'Issue deleted successfully.' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update issue status (ghayer halet el moshkle)
// @route   PATCH /api/issues/:id/status
// @access  Private (Author only)
const updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'in_progress', 'solved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use pending, in_progress, or solved.' });
        }

        // 1. Mnshouf eza l moshkle mawjoude w eza l user huwe l author
        const { data: issue, error: findError } = await supabaseAdmin
            .from('issues')
            .select('author_id')
            .eq('id', id)
            .single();

        if (findError || !issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
        }

        if (issue.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this issue status.' });
        }

        // 2. Mna3mel update lal status
        const { data: updatedIssue, error: updateError } = await supabaseAdmin
            .from('issues')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, data: updatedIssue });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all active categories (njib el fiaat el fa3ala)
// @route   GET /api/issues/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const { data: categories, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .order('name_en', { ascending: true });

        if (error) throw error;
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Upload media to storage (nerfa3 soura aw video)
// @route   POST /api/issues/upload-media
// @access  Private
const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please provide a file.' });
        }

        const publicUrl = await uploadToSupabase(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        return res.status(200).json({ success: true, url: publicUrl });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
};

module.exports = {
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
};
