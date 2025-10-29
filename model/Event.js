import mongoose from 'mongoose';

// Event Schema
const eventSchema = new mongoose.Schema({
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
    type: {
        type: String,
        required: [true, 'Event type is required'],
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
    eventDate: {
        type: Date,
        default: null
    },
    eventTime: {
        type: String,
        default: null,
        trim: true
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
eventSchema.index({ type: 1, isPublished: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ title: 'text', shortDescription: 'text', fullDescription: 'text' });

const Event = mongoose.model('Event', eventSchema);

export default Event;
