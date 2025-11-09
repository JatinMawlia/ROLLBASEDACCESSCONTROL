const express = require('express');
const Post = require('../models/Post');
const { authenticate, checkRole, checkOwnership } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    
    
    if (req.userRole !== 'Admin') {
      
    }

    const posts = await Post.find(query)
      .populate('authorId', 'username email')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'username email');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post', details: error.message });
  }
});

router.post('/', authenticate, checkRole('Admin', 'Editor'), async (req, res) => {
  try {
    const { title, content, isPublic } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const post = new Post({
      title,
      content,
      authorId: req.userId, // Set author to logged-in user
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await post.save();
    await post.populate('authorId', 'username email');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
});

router.put('/:id', 
  authenticate, 
  checkRole('Admin', 'Editor'), 
  checkOwnership('Post'), 
  async (req, res) => {
    try {
      const { title, content, isPublic } = req.body;

      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Update fields
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (isPublic !== undefined) post.isPublic = isPublic;

      await post.save();
      await post.populate('authorId', 'username email');

      res.json(post);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update post', details: error.message });
    }
  }
);

// DELETE /api/posts/:id - Delete post (only Admin)
router.delete('/:id', authenticate, checkRole('Admin'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
});

module.exports = router;

