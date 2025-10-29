import News from '../model/News.js';
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});


// Add News
const addNews = async (req, res) => {
  try {
    const { title, shortDescription, fullDescription, author, imageUrl } = req.body;

    // Validation
    if (!title || title.trim().length < 3) {
      return res.json({ success: false, message: "Title must be at least 3 characters" });
    }
    if (!shortDescription || shortDescription.trim().length < 10) {
      return res.json({ success: false, message: "Short description must be at least 10 characters" });
    }
    if (!fullDescription || fullDescription.trim().length < 10) {
      return res.json({ success: false, message: "Full description must be at least 10 characters" });
    }

    const authorName = author && author.trim().length >= 2 ? author.trim() : 'Admin';

    let finalImageUrl = imageUrl || null;

    if (req.files) {
      // ---- IMAGE upload ----
      if (req.files.image && req.files.image[0]) {
        const imageFile = req.files.image[0];
        const uploadData = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(uploadData, {
          resource_type: 'image',
          folder: 'irisehub/news',
        });
        finalImageUrl = result.secure_url;
      }

    }

    const newsData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      author: authorName,
      image: finalImageUrl,
      isPublished: true,
      publishedAt: new Date(),
    };

    const news = new News(newsData);
    await news.save();

    res.json({
      success: true,
      message: "News created successfully! ✅",
      data: news,
    });

  } catch (error) {
    console.error('❌ Create News Error:', error);
    res.json({ success: false, message: `Server error: ${error.message}` });
  }
};



// Get All News
const getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const news = await News.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments({});
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.json({ success: false, message: 'Failed to fetch news' });
  }
};

// Get News by ID
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.json({ success: false, message: 'News not found' });

    news.views += 1;
    await news.save();

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.json({ success: false, message: 'Failed to fetch news' });
  }
};

// Update News
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, fullDescription, author, imageUrl } = req.body;

    const updateData = {};
    if (title?.trim()) updateData.title = title.trim();
    if (shortDescription?.trim()) updateData.shortDescription = shortDescription.trim();
    if (fullDescription?.trim()) updateData.fullDescription = fullDescription.trim();
    if (author?.trim()) updateData.author = author.trim();
    if (imageUrl !== undefined) updateData.image = imageUrl;

    if (req.files) {
      // Image update
      if (req.files.image && req.files.image[0]) {
        const imageFile = req.files.image[0];
        const uploadData = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(uploadData, {
          resource_type: 'image',
          folder: 'irisehub/news',
        });
        updateData.image = result.secure_url;
      }
    }

    const news = await News.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!news) return res.json({ success: false, message: "News not found" });

    res.json({ success: true, message: "News updated successfully! ✅", data: news });
  } catch (error) {
    console.error('❌ Update News Error:', error);
    res.json({ success: false, message: error.message || 'Failed to update news' });
  }
};

// Delete News
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndDelete(id);
    if (!news) return res.json({ success: false, message: "News not found" });

    res.json({ success: true, message: "News deleted successfully! ✅" });
  } catch (error) {
    console.error('Delete News Error:', error);
    res.json({ success: false, message: error.message || 'Failed to delete news' });
  }
};

// Toggle Publish Status
const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.json({ success: false, message: "News not found" });

    news.isPublished = !news.isPublished;
    news.publishedAt = news.isPublished ? new Date() : null;
    await news.save();

    res.json({
      success: true,
      message: `News ${news.isPublished ? 'published' : 'unpublished'} successfully! ✅`,
      data: news,
    });
  } catch (error) {
    console.error('Toggle Publish Error:', error);
    res.json({ success: false, message: error.message || 'Failed to toggle publish status' });
  }
};

export {
  addNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  togglePublish
};
