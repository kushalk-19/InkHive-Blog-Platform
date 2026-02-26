const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Category = require('../models/Category');
const Blog = require('../models/Blog');
const Feedback = require('../models/Feedback');

console.log('userRoutes.js LOADED AT:', new Date().toISOString());
// Multer config: Store images in /uploads with unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const id = req.admin ? req.admin.adminID : req.user.userID;
    if (!id) {
      return cb(new Error('User ID not found'));
    }
    cb(null, `${id}-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/register', async (req, res) => {
  const { userName, userEmail, userPassword } = req.body;

  // Basic required check (schema will handle more)
  if (!userName || !userEmail || !userPassword) {
    return res.status(400).json({ msg: 'Please provide username, email, and password' });
  }

  try {
    // Check for existing username or email
    const existingUser = await User.findOne({ $or: [{ userEmail }, { userName }] });
    if (existingUser) {
      if (existingUser.userEmail === userEmail) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      if (existingUser.userName === userName) {
        return res.status(400).json({ msg: 'Username already in use' });
      }
    }

    // Create new user (validations and hashing happen in schema)
    const newUser = new User({
      userName,
      userEmail,
      userPassword  // Plain text; validated and hashed automatically
    });

    await newUser.save();

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      // Extract first validation error message
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ msg });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  const { userEmail, userPassword } = req.body;

  if (!userEmail || !userPassword) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ userEmail });
    if (!user || !(await user.comparePassword(userPassword))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userID: user.userID, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set JWT in httpOnly cookie
    res.cookie('userJWTToken', token, {
      httpOnly: true,
      secure: false,  // Set to true in production (requires HTTPS)
      sameSite: 'strict',
      maxAge: 3600000  // 1 hour in milliseconds
    });

    // Prepare user data to send (without sensitive info like password)
    const userData = {
      userID: user.userID,
      userName: user.userName,
      userEmail: user.userEmail,
      role: user.role
      // Add more fields if needed, e.g., userImage, but avoid sensitive ones
    };

    res.status(200).json({ msg: 'Login successful', user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET current user details
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID }).select('-userPassword');  // Exclude password
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET USER PROFILE BY ID (Public - works for both user & admin)
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await User.findOne(
      { $or: [{ userID: userId }, { adminID: userId }] },
      { userName: 1, userEmail: 1, userImage: 1, role: 1, userBio: 1, created_at: 1 }
    ).lean();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      userName: user.userName,
      userEmail: user.userEmail,
      userImage: user.userImage ? `http://localhost:5000${user.userImage}` : null,
      role: user.role,
      userBio: user.userBio || 'No bio yet.',
      created_at: user.created_at
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET ALL APPROVED BLOGS BY A SPECIFIC USER/ADMIN (Public)
router.get('/blogs/by-user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const blogs = await Blog.find({
      $or: [{ userID: userId }, { adminID: userId }],
      blogStatus: 'approved'
    })
      .sort({ created_at: -1 })
      .lean();

    if (blogs.length === 0) {
      return res.json([]);
    }

    // Get all category IDs
    const categoryIds = [...new Set(blogs.map(b => b.categoryID))];
    const categories = await Category.find(
      { categoryID: { $in: categoryIds } },
      { categoryID: 1, categoryName: 1 }
    ).lean();

    const catMap = {};
    categories.forEach(c => catMap[c.categoryID] = c.categoryName);

    // Get author name (from User collection)
    const authorIds = [...new Set([
      ...blogs.map(b => b.userID).filter(Boolean),
      ...blogs.map(b => b.adminID).filter(Boolean)
    ])];

    const users = await User.find(
      { $or: [{ userID: { $in: authorIds } }, { adminID: { $in: authorIds } }] },
      { userName: 1, userID: 1, adminID: 1 }
    ).lean();

    const userMap = {};
    users.forEach(u => {
      if (u.userID) userMap[u.userID] = u.userName;
      if (u.adminID) userMap[u.adminID] = u.userName;
    });

    // Format exactly like your main /blogs route
    const formattedBlogs = blogs.map(blog => ({
      id: blog.blogID,
      title: blog.blogTitle,
      snippet: blog.blogDescription.substring(0, 120) + '...',
      image: `http://localhost:5000${blog.blogImage}`,
      category: catMap[blog.categoryID] || 'Uncategorized',
      author: userMap[blog.userID] || userMap[blog.adminID] || 'Unknown Author',
      authorId: blog.userID || blog.adminID,  // ← Important for linking!
      date: blog.created_at,
      likes: blog.likes || [],
      comments: blog.comments || []
    }));

    res.json(formattedBlogs);
  } catch (err) {
    console.error('Blogs by user error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET CURRENT USER'S ALL BLOGS — Approved/Pending/Rejected for user profile page
router.get('/my-blogs', auth, async (req, res) => {
  try {
    const userID = req.user.userID;

    const blogs = await Blog.find({ userID })
      .sort({ created_at: -1 })
      .lean();

    if (blogs.length === 0) {
      return res.json([]);
    }

    // Get user map
    const allUserIds = [...new Set([
      userID,
      ...blogs.map(b => b.adminID).filter(Boolean)
    ])];

    const users = await User.find({
      $or: [
        { userID: { $in: allUserIds } },
        { adminID: { $in: allUserIds } }
      ]
    }, { userName: 1, userID: 1, adminID: 1 }).lean();

    const userMap = {};
    users.forEach(u => {
      if (u.userID) userMap[u.userID] = u.userName;
      if (u.adminID) userMap[u.adminID] = u.userName;
    });

    // Get category map
    const categoryIds = [...new Set(blogs.map(b => b.categoryID))];
    const categories = await Category.find({ categoryID: { $in: categoryIds } }).lean();
    const catMap = {};
    categories.forEach(c => catMap[c.categoryID] = c.categoryName);

    // FORMAT EXACTLY LIKE /blogs ROUTE
    const formattedBlogs = blogs.map(blog => ({
      id: blog.blogID,                                          // BlogCard uses 'id'
      title: blog.blogTitle,                                    // 'title'
      snippet: blog.blogDescription.substring(0, 120) + '...',   // 'snippet'
      image: `http://localhost:5000${blog.blogImage}`,          // 'image'
      category: catMap[blog.categoryID] || 'Unknown',           // 'category'
      author: userMap[blog.userID] || 'You',                    // 'author'
      date: blog.created_at,                                    // 'date'
      likes: blog.likes?.filter(id => id !== null && id !== undefined) || [],
      comments: blog.comments || [],
      blogStatus: blog.blogStatus                               // extra, for badges if you want
    }));

    res.json(formattedBlogs);
  } catch (err) {
    console.error('My Blogs Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// PUT update user profile details (with optional image upload)
router.put('/update', auth, upload.single('userImage'), async (req, res) => {
  const { firstName, lastName, userGender, userContact, userBio } = req.body;
  const updateData = { firstName, lastName, userGender, userContact, userBio };

  if (req.file) {
    updateData.userImage = `/uploads/${req.file.filename}`;  // Save relative path
  }

  try {
    const user = await User.findOneAndUpdate(
      { userID: req.user.userID },
      { $set: updateData },
      { new: true, runValidators: true }  // Run validators on update
    ).select('-userPassword');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({ msg: 'Details updated successfully', user });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ msg });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/users/blogs - display all blogs from DB on user side
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ blogStatus: 'approved' })
      .sort({ created_at: -1 })
      .lean();

    // Get all IDs
    const adminIds = blogs.filter(b => b.adminID).map(b => b.adminID);
    const userIds = blogs.filter(b => b.userID).map(b => b.userID);
    const allIds = [...new Set([...adminIds, ...userIds])];

    // Fetch users
    const users = await User.find(
      { $or: [{ adminID: { $in: allIds } }, { userID: { $in: allIds } }] },
      { userName: 1, adminID: 1, userID: 1 }
    ).lean();

    const userMap = {};
    users.forEach(u => {
      if (u.adminID) userMap[u.adminID] = u.userName;
      if (u.userID) userMap[u.userID] = u.userName;
    });

    // Fetch categories
    const categoryIds = blogs.map(b => b.categoryID);
    const categories = await Category.find(
      { categoryID: { $in: categoryIds } },
      { categoryID: 1, categoryName: 1 }
    ).lean();

    const catMap = {};
    categories.forEach(c => catMap[c.categoryID] = c.categoryName);

    const formatted = blogs.map(blog => {
      // CLEAN NULL VALUES
      const cleanLikes = Array.isArray(blog.likes)
        ? blog.likes.filter(id => id !== null && id !== undefined)
        : [];

      return {
        id: blog.blogID,
        title: blog.blogTitle,
        snippet: blog.blogDescription.substring(0, 120) + '...',
        image: `http://localhost:5000${blog.blogImage}`,
        category: catMap[blog.categoryID] || 'Unknown',
        author: userMap[blog.adminID] || userMap[blog.userID] || 'Anonymous',
        blogBy: blog.blogBy,
        date: blog.created_at,
        likes: cleanLikes,           // ← CLEAN ARRAY
        comments: blog.comments || [] // ← SAFE
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// NEW ROUTE: Only for Featured Carousel (Top 4 latest approved blogs)
router.get('/blogs/featured', async (req, res) => {
  try {
    const blogs = await Blog.find({ blogStatus: 'approved' })
      .sort({ created_at: -1 })
      .limit(4)
      .lean();

    if (blogs.length === 0) {
      return res.json([]);
    }

    // Get user & category maps (same logic as your main route)
    const adminIds = blogs.filter(b => b.adminID).map(b => b.adminID);
    const userIds = blogs.filter(b => b.userID).map(b => b.userID);
    const allIds = [...new Set([...adminIds, ...userIds])];

    const users = await User.find(
      { $or: [{ adminID: { $in: allIds } }, { userID: { $in: allIds } }] },
      { userName: 1, adminID: 1, userID: 1 }
    ).lean();

    const userMap = {};
    users.forEach(u => {
      if (u.adminID) userMap[u.adminID] = u.userName;
      if (u.userID) userMap[u.userID] = u.userName;
    });

    const categoryIds = [...new Set(blogs.map(b => b.categoryID))];
    const categories = await Category.find(
      { categoryID: { $in: categoryIds } },
      { categoryID: 1, categoryName: 1 }
    ).lean();

    const catMap = {};
    categories.forEach(c => catMap[c.categoryID] = c.categoryName);

    const formatted = blogs.map(blog => ({
      blogID: blog.blogID,                                    // Correct for Link
      blogTitle: blog.blogTitle,
      blogDescription: blog.blogDescription,
      blogImage: `http://localhost:5000${blog.blogImage}`,
      categoryName: catMap[blog.categoryID] || 'Unknown',
      author: userMap[blog.adminID] || userMap[blog.userID] || 'Anonymous',
      created_at: blog.created_at,
      date: blog.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/users/blogs/:id - get single blog details
router.get('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogID: parseInt(req.params.id) });
    if (!blog || blog.blogStatus !== 'approved') {
      return res.status(404).json({ msg: 'Blog not found' });
    }

    // FETCH USERS FOR AUTHOR + COMMENTS
    const userIds = [...new Set([
      blog.adminID,
      blog.userID,
      ...blog.comments.map(c => c.userID).filter(Boolean)
    ])];

    //const users = await User.find({ userID: { $in: userIds } }).lean();
    const users = await User.find({
      $or: [
        { userID: { $in: userIds.filter(id => id < 1000) } },  // Users
        { adminID: { $in: userIds.filter(id => id >= 1000) } } // Admins
      ]
    }).lean();
    const userMap = {};
    // users.forEach(u => userMap[u.userID] = u.userName);
    users.forEach(u => {
      if (u.userID) userMap[u.userID] = u.userName;
      if (u.adminID) userMap[u.adminID] = u.userName;
    });

    const category = await Category.findOne({ categoryID: blog.categoryID });
    const catName = category?.categoryName || 'Unknown';

    const formatted = {
      id: blog.blogID,
      title: blog.blogTitle,
      snippet: blog.blogDescription,
      image: `http://localhost:5000${blog.blogImage}`,
      category: catName,
      author: userMap[blog.adminID] || userMap[blog.userID] || 'Anonymous',
      authorId: blog.userID || blog.adminID,
      blogBy: blog.blogBy,
      date: blog.created_at,
      likes: blog.likes || [],
      comments: blog.comments.map(c => ({
        _id: c._id,
        userID: c.userID,
        commentText: c.commentText,
        author: userMap[c.userID] || `User ${c.userID}`,
        timestamp: c.created_at
      }))
    };

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/users/blogs - add blog post request from user side
router.post('/blogs', auth, upload.single('blogImage'), async (req, res) => {
  const { blogTitle, blogDescription, categoryID } = req.body;
  const userID = req.user.userID;

  // VALIDATION
  if (!blogTitle?.trim() || blogTitle.trim().length < 5 || blogTitle.trim().length > 100) {
    return res.status(400).json({ msg: 'Title must be 5–100 characters' });
  }
  if (!blogDescription?.trim() || blogDescription.trim().length < 100) {
    return res.status(400).json({ msg: 'Description must be at least 100 characters' });
  }
  if (!categoryID) {
    return res.status(400).json({ msg: 'Category is required' });
  }
  if (!req.file) {
    return res.status(400).json({ msg: 'Image is required' });
  }

  try {
    const blog = new Blog({
      blogTitle: blogTitle.trim(),
      blogDescription: blogDescription.trim(),
      blogImage: `/uploads/${req.file.filename}`,
      categoryID: parseInt(categoryID),
      blogBy: 'user',
      userID: userID,
      blogStatus: 'pending'
      // created_at auto
    });

    await blog.save();
    res.json({ msg: 'Blog post request submitted for approval!', blogID: blog.blogID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// UPDATE BLOG — ANY STATUS → BECOMES PENDING
// UPDATE BLOG — USER CAN EDIT ANY OF THEIR BLOGS
router.put('/blogs/:blogId', auth, upload.single('blogImage'), async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId);
    const userId = req.user.userID;

    if (isNaN(blogId)) {
      return res.status(400).json({ msg: 'Invalid blog ID' });
    }

    const { blogTitle, blogDescription, categoryID } = req.body;

    // Validate required fields
    if (!blogTitle?.trim()) return res.status(400).json({ msg: 'Title is required' });
    if (!blogDescription?.trim()) return res.status(400).json({ msg: 'Content is required' });

    const catId = parseInt(categoryID);
    if (isNaN(catId)) return res.status(400).json({ msg: 'Valid category is required' });

    const updateData = {
      blogTitle: blogTitle.trim(),
      blogDescription: blogDescription.trim(),
      categoryID: catId,
      blogStatus: 'pending'
    };

    if (req.file) {
      updateData.blogImage = `/uploads/${req.file.filename}`;
    }

    const blog = await Blog.findOneAndUpdate(
      { blogID: blogId, userID: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found or not yours' });
    }

    res.json({ msg: 'Blog updated successfully! Status: Pending review' });
  } catch (err) {
    console.error('Update blog error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// DELETE BLOG
router.delete('/blogs/:blogId', auth, async (req, res) => {
  try {
    const result = await Blog.deleteOne({
      blogID: parseInt(req.params.blogId),
      userID: req.user.userID
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: 'Blog not found or not yours' });
    }

    res.json({ msg: 'Blog deleted permanently' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


// user give feedback
router.post('/feedback', auth, async (req, res) => {
  try {
    const { feedbackDescription } = req.body;

    if (!feedbackDescription || feedbackDescription.trim().length < 10 || feedbackDescription.trim().length > 200) {
      return res.status(400).json({ msg: 'Feedback must be 10-200 characters' });
    }

    const feedback = new Feedback({
      feedbackDescription: feedbackDescription.trim(),
      userID: req.user.userID
    });

    await feedback.save();

    res.json({
      msg: 'Thank you for your feedback!',
      feedback: {
        id: feedback.feedbackID,
        description: feedback.feedbackDescription,
        date: feedback.feedbackDate.toLocaleDateString()
      }
    });
  } catch (err) {
    console.error('Feedback POST error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET ALL FEEDBACK (Public - for display)
router.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ feedbackDate: -1 })
      .lean();

    const userMap = {};
    const userIds = [...new Set(feedbacks.map(f => f.userID))];

    if (userIds.length > 0) {
      const users = await User.find({ userID: { $in: userIds } })
        .select('userID userName')
        .lean();
      users.forEach(u => userMap[u.userID] = u.userName || 'Anonymous');
    }

    const formatted = feedbacks.map(f => ({
      id: f.feedbackID,
      username: userMap[f.userID] || 'Anonymous',
      description: f.feedbackDescription,
      date: new Date(f.feedbackDate).toLocaleDateString()
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Feedback GET error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/logout', (req, res) => {
  res.clearCookie('userJWTToken', {
    httpOnly: true,
    secure: false,  // Set to true in production with HTTPS
    sameSite: 'strict'
  });
  res.status(200).json({ msg: 'Logged out successfully' });
});

// module.exports = router;


// admin routes
// POST /api/users/admin-login
router.post('/admin-login', async (req, res) => {
  const { userEmail, userPassword } = req.body;

  if (!userEmail || !userPassword) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ userEmail });
    if (!user || !(await user.comparePassword(userPassword))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Only allow admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Admin only' });
    }

    console.log('GENERATING JWT WITH adminID:', user.adminID, 'TYPE:', typeof user.adminID);
    // Use adminID (from your DB) in JWT payload
    const token = jwt.sign(
      { adminID: user.adminID, role: user.role },   // ← THIS LINE
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    // Set cookie as adminJWTToken
    res.cookie('adminJWTToken', token, {
      httpOnly: true,
      secure: false,           // true in production
      sameSite: 'strict',
      maxAge: 3600000          // 1 hour
    });

    // Send minimal admin data
    const adminData = {
      adminID: user.adminID,
      userName: user.userName,
      userEmail: user.userEmail,
      role: user.role
    };

    res.status(200).json({ msg: 'Admin login successful', admin: adminData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET ALL USERS from database– on admin side
router.get('/all', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-userPassword')
      .sort({ created_at: -1 });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// DELETE /api/users/:id - Delete a user (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ msg: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/users/admin-profile - Get current admin profile
router.get('/admin-profile', adminAuth, async (req, res) => {
  try {

    console.log('Looking for adminID:', req.admin.adminID, typeof req.admin.adminID); // ← ADD

    const admin = await User.findOne({
      adminID: req.admin.adminID,
      role: 'admin'
    })
      .select('userName userEmail userImage userContact role adminID')
      .lean();

    if (!admin) {
      return res.status(404).json({ msg: 'Admin profile not found' });
    }

    res.json({ msg: 'Profile fetched', admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/users/admin-profile - Update admin profile
router.patch('/admin-profile', adminAuth, upload.single('userImage'), async (req, res) => {
  const { userName, userContact } = req.body;

  // Validation
  if (userName && (userName.length < 8 || userName.length > 60 || /\s/.test(userName))) {
    return res.status(400).json({ msg: 'Username: 8–16 chars, no spaces' });
  }
  if (userContact && !/^[6-9]\d{9}$/.test(userContact)) {
    return res.status(400).json({ msg: 'Contact: 10 digits, starts with 6-9' });
  }

  try {
    const updateData = {};
    if (userName) updateData.userName = userName.toLowerCase();
    if (userContact) updateData.userContact = userContact;
    if (req.file) {
      updateData.userImage = `/uploads/${req.file.filename}`; // ← e.g., 1001-1234567890-photo.jpg
    }

    const updated = await User.findOneAndUpdate(
      { adminID: req.admin.adminID, role: 'admin' },
      { $set: updateData },
      { new: true }
    ).select('userName userEmail userImage userContact role adminID');

    if (!updated) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    res.json({ msg: 'Profile updated', admin: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ADMIN: GET ALL USERS (only real users with userID)
router.get('/admin/users', async (req, res) => {
  try {
    // Count EVERY user with role: 'user' — no matter if userID exists or not
    const users = await User.find({ role: 'user' })
      .select('userName userEmail userID created_at')
      .lean();

    console.log('Total users found:', users.length); // ← Add this to debug
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ADMIN: GET ALL BLOGS (FIXED categoryID & userName)
router.get('/admin/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate({
        path: 'categoryID',
        select: 'categoryID categoryName'
      })
      .lean();

    // Extract userIDs from user-written blogs
    const userWrittenBlogs = blogs.filter(b => b.blogBy === 'user' && b.userID);
    const userIds = [...new Set(userWrittenBlogs.map(b => b.userID))];

    const userMap = {};
    if (userIds.length > 0) {
      const users = await User.find({
        userID: { $in: userIds },
        role: 'user'
      })
        .select('userID userName')
        .lean();

      users.forEach(u => {
        userMap[u.userID] = u.userName || 'Unknown User';
      });
    }

    const formattedBlogs = blogs.map(blog => {
      const category = blog.categoryID;
      const categoryIdToUse = category?._id || category?.categoryID || category;

      return {
        blogID: blog.blogID || blog._id,
        blogTitle: blog.blogTitle || 'Untitled',
        blogStatus: blog.blogStatus || 'pending',
        blogBy: blog.blogBy || 'user',
        userID: blog.userID,
        adminID: blog.adminID,
        categoryID: categoryIdToUse,
        categoryName: category?.categoryName || 'Uncategorized',
        created_at: blog.created_at,
        userName: blog.blogBy === 'user'
          ? (userMap[blog.userID] || 'Deleted User')
          : 'Admin'
      };
    });

    res.json(formattedBlogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/users/admin-categories - Add category (admin only)
router.post('/admin-categories', adminAuth, async (req, res) => {
  const { categoryName } = req.body;

  if (!categoryName || categoryName.length < 4 || categoryName.length > 15) {
    return res.status(400).json({ msg: 'Category name must be 4–15 characters' });
  }

  try {
    const category = new Category({
      categoryName: categoryName.trim(),
      categoryBy: 'admin',
      adminID: req.admin.adminID,
      userID: null,
    });

    await category.save();
    res.status(201).json({ msg: 'Category added', category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/users/admin-categories - Get all categories with admin email
router.get('/admin-categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ categoryID: 1 }).lean();

    // Manually fetch emails
    const adminIds = categories.map(c => c.adminID).filter(Boolean);
    const userIds = categories.map(c => c.userID).filter(Boolean);
    const allIds = [...new Set([...adminIds, ...userIds])];

    const users = await User.find(
      { $or: [{ adminID: { $in: allIds } }, { userID: { $in: allIds } }] },
      { userEmail: 1, adminID: 1, userID: 1 }
    ).lean();

    const emailMap = {};
    users.forEach(u => {
      if (u.adminID) emailMap[u.adminID] = u.userEmail;
      if (u.userID) emailMap[u.userID] = u.userEmail;
    });

    const formatted = categories.map(cat => ({
      ...cat,
      email: cat.adminID ? emailMap[cat.adminID] :
        cat.userID ? emailMap[cat.userID] : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// PATCH /api/users/admin-categories/:id
router.patch('/admin-categories/:id', adminAuth, async (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName || categoryName.length < 4 || categoryName.length > 15) {
    return res.status(400).json({ msg: 'Category name must be 4–15 characters' });
  }

  try {
    const updated = await Category.findOneAndUpdate(
      { categoryID: parseInt(req.params.id), categoryBy: 'admin' },
      { categoryName: categoryName.trim() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: 'Category not found' });
    res.json({ msg: 'Updated', category: updated });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


// DELETE /api/users/admin-categories/:id
router.delete('/admin-categories/:id', adminAuth, async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({
      categoryID: parseInt(req.params.id),
      categoryBy: 'admin'
    });
    if (!deleted) return res.status(404).json({ msg: 'Category not found' });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/users/admin-blogs
router.post('/admin-blogs', adminAuth, upload.single('blogImage'), async (req, res) => {
  const { blogTitle, blogDescription, categoryID } = req.body;

  if (!blogTitle || !blogDescription || !categoryID) {
    return res.status(400).json({ msg: 'All fields required' });
  }

  try {
    const blog = new Blog({
      blogTitle: blogTitle.trim(),
      blogDescription: blogDescription.trim(),
      categoryID: parseInt(categoryID),
      blogImage: req.file ? `/uploads/${req.file.filename}` : null,
      blogBy: 'admin',
      adminID: req.admin.adminID,
      userID: null,
      blogStatus: 'approved'
    });

    await blog.save();

    // Manual populate
    const category = await Category.findOne({ categoryID: blog.categoryID });
    const populated = {
      ...blog.toObject(),
      categoryID: {
        categoryID: blog.categoryID,
        categoryName: category ? category.categoryName : 'Unknown'
      }
    };

    res.status(201).json({ msg: 'Blog added', blog: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/users/admin-blogs - display all approved blogs on admin side
router.get('/admin-blogs', async (req, res) => {
  try {
    // FILTER: ONLY APPROVED
    const blogs = await Blog.find({ blogStatus: 'approved' })
      .sort({ created_at: -1 })
      .lean();

    // Manual populate category name
    const categoryIds = blogs.map(b => b.categoryID);
    const categories = await Category.find(
      { categoryID: { $in: categoryIds } },
      { categoryID: 1, categoryName: 1 }
    ).lean();

    const catMap = {};
    categories.forEach(c => catMap[c.categoryID] = c.categoryName);

    const formatted = blogs.map(blog => ({
      ...blog,
      likes: blog.likes.filter(id => id !== null),
      categoryID: {
        categoryID: blog.categoryID,
        categoryName: catMap[blog.categoryID] || 'Unknown'
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/users/blogs/:id/like (TOGGLE LIKE)
router.post('/blogs/:id/like', auth, async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogID: parseInt(req.params.id) });
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    const userId = req.user?.userID;
    if (!userId) return res.status(401).json({ msg: 'Login required' });

    // CLEAN NULL
    blog.likes = Array.isArray(blog.likes)
      ? blog.likes.filter(id => id !== null)
      : [];

    const liked = blog.likes.includes(userId);

    if (liked) {
      blog.likes = blog.likes.filter(id => id !== userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json({ likes: blog.likes.length, liked: !liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/users/blogs/:id/comment (ADD COMMENT)
// POST /blogs/:id/comment
router.post('/blogs/:id/comment', auth, async (req, res) => {
  const { commentText } = req.body;
  if (!commentText?.trim()) return res.status(400).json({ msg: 'Comment required' });
  if (commentText.trim().length > 100) return res.status(400).json({ msg: 'Max 100 characters' });

  try {
    const blog = await Blog.findOne({ blogID: parseInt(req.params.id) });
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    const userId = req.user?.userID;
    if (!userId) return res.status(401).json({ msg: 'Login required' });

    const comment = {
      commentBy: 'user',
      userID: userId,
      commentText: commentText.trim(),
    };

    blog.comments.push(comment);
    await blog.save();

    res.json({ msg: 'Comment added', comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// delete comment at user side 
router.delete('/blogs/:id/comment/:commentId', auth, async (req, res) => {
  try {
    const blog = await Blog.findOne({ blogID: parseInt(req.params.id) });
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    const commentIndex = blog.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) return res.status(404).json({ msg: 'Comment not found' });

    // Check ownership
    if (blog.comments[commentIndex].userID !== req.user.userID) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    blog.comments.splice(commentIndex, 1);
    await blog.save();

    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET /api/admin/blogs/pending display all pending blogs in admin side for approve/reject in manage blogs request
router.get('/blogs/admin/pending', adminAuth, async (req, res) => {
  try {
    const blogs = await Blog.find({ blogStatus: 'pending' }).sort({ created_at: -1 });

    const userIds = blogs.map(b => b.userID).filter(Boolean);
    const users = await User.find({ userID: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => userMap[u.userID] = u.userName);

    const categoryIds = [...new Set(blogs.map(b => b.categoryID))];
    const categories = await Category.find({ categoryID: { $in: categoryIds } }).lean();
    const catMap = {};
    categories.forEach(c => catMap[c.categoryID] = c.categoryName);

    const formatted = blogs.map(blog => ({
      id: blog.blogID,
      title: blog.blogTitle,
      author: userMap[blog.userID] || 'Unknown User',
      category: catMap[blog.categoryID] || 'Unknown',
      snippet: blog.blogDescription.substring(0, 150) + '...',
      fullDescription: blog.blogDescription,
      blogImage: blog.blogImage,
      date: blog.created_at,
      status: blog.blogStatus
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// APPROVE admin set blogStatus to 'approved' from manage blogs request
router.put('/blogs/admin/:id/approve', adminAuth, async (req, res) => {
  try {
    const blogID = parseInt(req.params.id);
    if (isNaN(blogID)) return res.status(400).json({ msg: 'Invalid blog ID' });

    const blog = await Blog.findOneAndUpdate(
      { blogID, blogStatus: 'pending' },
      { blogStatus: 'approved' },
      { new: true }
    );
    if (!blog) return res.status(404).json({ msg: 'Blog not found or not pending' });
    res.json({ msg: 'Blog approved!', blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// REJECT admin set blogStatus to 'rejected' from manage blogs request
router.put('/blogs/admin/:id/reject', adminAuth, async (req, res) => {
  try {
    const blogID = parseInt(req.params.id);
    if (isNaN(blogID)) return res.status(400).json({ msg: 'Invalid blog ID' });

    const blog = await Blog.findOneAndUpdate(
      { blogID, blogStatus: 'pending' },
      { blogStatus: 'rejected' },
      { new: true }
    );
    if (!blog) return res.status(404).json({ msg: 'Blog not found or not pending' });
    res.json({ msg: 'Blog rejected!', blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ADMIN: GET ALL FEEDBACK WITH USER DETAILS
router.get('/admin/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ feedbackDate: -1 })
      .lean();

    if (feedbacks.length === 0) {
      return res.json([]);
    }

    // Get all unique userIDs
    const userIds = [...new Set(feedbacks.map(f => f.userID))];

    // Fetch user details
    const users = await User.find({
      userID: { $in: userIds }
    })
      .select('userID userName userEmail userImage')
      .lean();

    // Create user map
    const userMap = {};
    users.forEach(u => {
      userMap[u.userID] = {
        username: u.userName || 'Deleted User',
        email: u.userEmail || 'N/A',
        profilePicture: u.userImage ? `http://localhost:5000${u.userImage}` : null
      };
    });

    // Format feedback with user info
    const formattedFeedbacks = feedbacks.map(f => ({
      id: f.feedbackID,
      username: userMap[f.userID]?.username || 'Deleted User',
      email: userMap[f.userID]?.email || 'N/A',
      profilePicture: userMap[f.userID]?.profilePicture,
      description: f.feedbackDescription,
      date: new Date(f.feedbackDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }));

    res.json(formattedFeedbacks);
  } catch (err) {
    console.error('Admin feedback route error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// POST /api/users/admin-logout - Logout admin
router.post('/admin-logout', (req, res) => {
  res.clearCookie('adminJWTToken', {
    httpOnly: true,
    secure: false,  // true in production
    sameSite: 'strict'
  });
  res.status(200).json({ msg: 'Admin logged out successfully' });
});

module.exports = router;