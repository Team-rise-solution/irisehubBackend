import Story from '../model/Story.js';
import mongoose from 'mongoose';
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Submit Story (Public - users can submit)
export const submitStory = async (req, res) => {
  try {
    console.log('📝 Story submission received:', req.body);
    const { name, number, email, storyTitle, description } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.json({ success: false, message: "Name must be at least 2 characters" });
    }
    if (!number || number.trim().length < 5) {
      return res.json({ success: false, message: "Phone number is required" });
    }
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.json({ success: false, message: "Valid email is required" });
    }
    if (!storyTitle || storyTitle.trim().length < 3) {
      return res.json({ success: false, message: "Story title must be at least 3 characters" });
    }
    if (!description || description.trim().length < 10) {
      return res.json({ success: false, message: "Description must be at least 10 characters" });
    }

    let imageUrl = null;

    // Handle image upload
    console.log('📁 File received:', req.file ? 'YES' : 'NO');
    console.log('📁 Request body keys:', Object.keys(req.body));
    console.log('📁 Request files:', req.files);
    console.log('📁 Request file:', req.file);
    console.log('📁 Content-Type:', req.headers['content-type']);
    
    if (req.file) {
      console.log('📁 File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      try {
        const uploadData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        if (req.file.mimetype.startsWith('image/')) {
          console.log('📸 Uploading image to Cloudinary...');
          const result = await cloudinary.uploader.upload(uploadData, {
            resource_type: 'image',
            folder: 'irisehub/stories',
          });
          imageUrl = result.secure_url;
          console.log('✅ Image uploaded:', imageUrl);
        }
      } catch (uploadError) {
        console.error('❌ Error uploading image:', uploadError);
        // Continue without image if upload fails
      }
    } else {
      console.log('⚠️ No file received in request');
    }
    
    console.log('📝 Story data to save:', {
      image: imageUrl ? 'YES' : 'NO'
    });

    const storyData = {
      name: name.trim(),
      number: number.trim(),
      email: email.trim().toLowerCase(),
      storyTitle: storyTitle.trim(),
      description: description.trim(),
      image: imageUrl,
      video: null, // No video support
      status: 'pending'
    };

    const story = await Story.create(storyData);
    
    console.log('✅ Story created successfully:', story._id);
    console.log('✅ Story saved with image:', story.image ? 'YES' : 'NO');

    res.json({
      success: true,
      message: 'Story submitted successfully! It will be reviewed by admin.',
      data: story
    });
  } catch (error) {
    console.error('Error submitting story:', error);
    res.json({
      success: false,
      message: 'Failed to submit story. Please try again.'
    });
  }
};

// Get All Approved Stories (Public - for display)
export const getApprovedStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const stories = await Story.find({ status: 'approved' })
      .sort({ approvedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-number -email -rejectedReason -approvedBy'); // Exclude sensitive data

    const total = await Story.countDocuments({ status: 'approved' });
    const totalPages = Math.ceil(total / limit);

    console.log('📖 Approved stories fetched:', stories.length);
    if (stories.length > 0) {
      console.log('📖 First story image:', stories[0].image);
      console.log('📖 First story video:', stories[0].video);
    }

    res.json({
      success: true,
      data: stories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching approved stories:', error);
    res.json({
      success: false,
      message: 'Failed to fetch stories'
    });
  }
};

// Get Story by ID (Public - for viewing)
export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .select('-number -email -rejectedReason -approvedBy');

    if (!story) {
      return res.json({
        success: false,
        message: 'Story not found'
      });
    }

    // Only show approved stories to public
    if (story.status !== 'approved') {
      return res.json({
        success: false,
        message: 'Story not found'
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.json({
      success: false,
      message: 'Failed to fetch story'
    });
  }
};

// Get All Stories (Admin - includes pending, approved, rejected)
export const getAllStories = async (req, res) => {
  try {
    console.log('📖 getAllStories called');
    console.log('📖 Story model:', Story ? 'exists' : 'NOT FOUND');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    const query = status ? { status } : {};

    console.log('📖 Fetching stories with query:', query);
    
    // Try to find stories
    let stories;
    try {
      stories = await Story.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Only populate if approvedBy exists
      if (stories.some(s => s.approvedBy)) {
        stories = await Story.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('approvedBy', 'name email');
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    const total = await Story.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`📖 Found ${stories.length} stories (total: ${total})`);

    res.json({
      success: true,
      data: stories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stories:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.json({
      success: false,
      message: 'Failed to fetch stories',
      error: error.message
    });
  }
};

// Approve Story (Admin)
export const approveStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if req.admin.id is a valid ObjectId
    let approvedById = req.admin.id;
    
    // If admin.id is not a valid ObjectId (e.g., 'super_admin'), skip approvedBy
    if (approvedById && approvedById !== 'super_admin' && mongoose.Types.ObjectId.isValid(approvedById)) {
      story.approvedBy = approvedById;
    } else {
      // If it's 'super_admin' or invalid, set to null (optional field)
      story.approvedBy = null;
    }
    
    story.status = 'approved';
    story.approvedAt = new Date();
    story.rejectedReason = null;

    await story.save();

    res.json({
      success: true,
      message: 'Story approved successfully',
      data: story
    });
  } catch (error) {
    console.error('Error approving story:', error);
    res.json({
      success: false,
      message: 'Failed to approve story'
    });
  }
};

// Reject Story (Admin)
export const rejectStory = async (req, res) => {
  try {
    const { rejectedReason } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.json({
        success: false,
        message: 'Story not found'
      });
    }

    story.status = 'rejected';
    story.rejectedReason = rejectedReason || 'Story does not meet our guidelines';
    story.approvedBy = null;
    story.approvedAt = null;

    await story.save();

    res.json({
      success: true,
      message: 'Story rejected successfully',
      data: story
    });
  } catch (error) {
    console.error('Error rejecting story:', error);
    res.json({
      success: false,
      message: 'Failed to reject story'
    });
  }
};

// Delete Story (Admin)
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);

    if (!story) {
      return res.json({
        success: false,
        message: 'Story not found'
      });
    }

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.json({
      success: false,
      message: 'Failed to delete story'
    });
  }
};

