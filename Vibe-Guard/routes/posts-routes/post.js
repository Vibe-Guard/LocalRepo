const express = require('express');
const router = express.Router();
const upload = require("../../config/multerconfig"); // Import the upload middleware
const Post = require("../../models/User/Posts.model");
const User = require("../../models/User/user.model");
const authenticateUser = require('../../middlewares/localuser-middleware');
const adminonly = require('../../middlewares/admin-middleware');



router.post('/create', upload.single('image'), authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;

    const imagePath = req.file ? `/images/${req.file.filename}` : ''; 


    const newPost = new Post({
      user: userId,
      content,
      imageUrl: imagePath,
    });

    await newPost.save();
    res.redirect('/post/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.get('/posts', authenticateUser, async (req, res) => {
  try {
    // Fetch posts where user is not null
    const posts = await Post.find({ user: { $ne: null } })
      .populate('user')      // populate user info
      .populate('comments.user')  // populate comments' users too (optional)
      .lean().sort({ createdAt: -1 });

    res.render('UserDashboard/u', {
      layout: false,
      posts: posts,
      currentUser: req.user || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});




//like
router.post('/like/:postId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).send("Post not found");

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    res.json({ 
      likes: post.likes, 
      currentUserId: userId.toString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
router.post('/:postId/comment', authenticateUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = {
      user: userId,
      text,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Fetch the post again and populate the last comment's user
    const updatedPost = await Post.findById(postId).populate('comments.user', 'username');

    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json(addedComment);
  } catch (err) {
    console.error('Comment POST error:', err);
    res.status(500).json({ error: "Server error" });
  }
});




// Add this in your post.js routes file
router.post('/rate/:postId', authenticateUser, async (req, res) => {
  try {
    const postId = req.params.postId;
    const { rating } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Ensure ratings array exists
    if (!post.ratings) post.ratings = [];

    // Check if user already rated
    const existing = post.ratings.find(r => r.user.toString() === userId.toString());
    if (existing) {
      existing.value = parseInt(rating);
    } else {
      post.ratings.push({ user: userId, value: parseInt(rating) });
    }

    // Recalculate average rating
    const avg = post.ratings.reduce((acc, r) => acc + r.value, 0) / post.ratings.length;
    post.averageRating = avg;

    await post.save();
    res.json({ averageRating: avg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.delete('/delete/:postId', adminonly, async (req, res) => {
  console.log('Delete route hit, user:', req.user, 'postId:', req.params.postId);
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.postId);
    if (!deletedPost) {
      console.log('Post not found for deletion:', req.params.postId);
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/report/:postId', authenticateUser, async (req, res) => {
  try {
    const { reason } = req.body;
    const postId = req.params.postId;

    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    // Log or notify if needed
    console.log(`Post ${postId} reported by ${req.user.username} for: ${reason}`);

    // Delete the post from DB
    await Post.findByIdAndDelete(postId); // Assuming you're using Mongoose

    // Respond
    res.json({ message: `Post has been reported and deleted due to: ${reason}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
