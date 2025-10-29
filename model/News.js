import mongoose from 'mongoose';

// News Schema
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    shortDescription: {
        type: String,
        required: [true, 'Short description is required'],
        trim: true,
        maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    fullDescription: {
        type: String,
        required: [true, 'Full description is required'],
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    author: {
        type: String,
        default: 'Admin',
        trim: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

newsSchema.index({ isPublished: 1 });
newsSchema.index({ createdAt: -1 });
newsSchema.index({ title: 'text', shortDescription: 'text', fullDescription: 'text' });

const News = mongoose.model('News', newsSchema);

export default News;
