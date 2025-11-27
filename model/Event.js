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
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true
    },
    speakerType: {
        type: String,
        enum: ['single', 'multiple'],
        default: 'single'
    },
    speakers: {
        type: [String],
        default: [],
        validate: {
            validator: function(arr) {
                if (!Array.isArray(arr)) return false;
                if (arr.length === 0) return true; // allow empty for legacy, handled in controller
                return arr.every(name => typeof name === 'string' && name.trim().length >= 2);
            },
            message: 'Each speaker name must be at least 2 characters'
        }
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
