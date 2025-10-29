import mongoose from 'mongoose';

// News/Events Schema
const viewnewesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['news', 'event', 'announcement'],
        default: 'news'
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['Coming Soon', 'Past Event'],
        default: 'Coming Soon'
    },
    youtubeLink: {
        type: String,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty
                return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(v);
            },
            message: 'Please provide a valid YouTube URL'
        }
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    eventDate: {
        type: Date,
        default: null
    },
    location: {
        type: String,
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

// Indexes for better performance
viewnewesSchema.index({ type: 1, isPublished: 1 });
viewnewesSchema.index({ createdAt: -1 });
viewnewesSchema.index({ title: 'text', content: 'text' });

const viewnewesModel = mongoose.model('ViewNewes', viewnewesSchema);

export default viewnewesModel;
