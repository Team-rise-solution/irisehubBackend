import Event from '../model/Event.js';
import cloudinary from 'cloudinary';

const parseSpeakersInput = (input) => {
    if (!input) return [];

    if (Array.isArray(input)) {
        return input;
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) return [];

        // Try JSON parse first
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            // Not JSON, continue
        }

        // Fallback: split by newline or comma
        return trimmed
            .split(/[\n,]/)
            .map(name => name.trim())
            .filter(Boolean);
    }

    return [];
};

const normalizeSpeakers = (rawSpeakers, speakerType = 'single') => {
    const cleaned = parseSpeakersInput(rawSpeakers)
        .map(name => name.trim())
        .filter(name => name.length >= 2);

    if (speakerType === 'single') {
        return cleaned.length > 0 ? [cleaned[0]] : [];
    }

    return cleaned;
};

// Add Event
const addEvent = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        
        const { title, shortDescription, fullDescription, author, type, youtubeLink, eventDate, eventTime, location, speakerType } = req.body;

        console.log('Extracted data:', { title, shortDescription, fullDescription, author, type, youtubeLink, eventDate, location });
        console.log('Title length:', title ? title.length : 'undefined');
        console.log('Title trimmed length:', title ? title.trim().length : 'undefined');

        // Validate input
        if (!title || title.trim().length < 3) {
            console.log('Validation failed for title:', { title, length: title ? title.length : 0, trimmedLength: title ? title.trim().length : 0 });
            return res.json({
                success: false,
                message: "Title must be at least 3 characters"
            });
        }

        if (!shortDescription || shortDescription.trim().length < 10) {
            return res.json({
                success: false,
                message: "Short description must be at least 10 characters"
            });
        }

        if (!fullDescription || fullDescription.trim().length < 10) {
            return res.json({
                success: false,
                message: "Full description must be at least 10 characters"
            });
        }

        if (!author || author.trim().length < 2) {
            return res.json({
                success: false,
                message: "Author name must be at least 2 characters"
            });
        }

        const normalizedSpeakerType = speakerType === 'multiple' ? 'multiple' : 'single';
        const speakers = normalizeSpeakers(req.body.speakers, normalizedSpeakerType);

        if (!speakers.length) {
            return res.json({
                success: false,
                message: "Please provide at least one speaker name"
            });
        }

        // Process uploaded files
        let imageUrl = null;
        
        console.log('🔍 Debugging file upload:');
        console.log('req.files:', req.files);
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);
        
        // Check if file is uploaded (multer.single creates req.file, not req.files)
        if (req.file) {
            console.log('📁 File found:', { 
                fieldname: req.file.fieldname, 
                filename: req.file.originalname, 
                size: req.file.size,
                mimetype: req.file.mimetype 
            });
            
            try {
                if (req.file.fieldname === 'image' && req.file.mimetype.startsWith('image/')) {
                    console.log('📸 Uploading image to Cloudinary...');
                    const result = await cloudinary.uploader.upload(
                        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, 
                        { 
                            resource_type: 'image',
                            folder: 'irisehub/events'
                        }
                    );
                    imageUrl = result.secure_url;
                    console.log('✅ Image uploaded successfully:', imageUrl);
                } else {
                    console.log('❌ Invalid file type or fieldname');
                }
            } catch (fileError) {
                console.error('Error processing file:', fileError);
            }
        } else {
            console.log('❌ No file uploaded');
        }

        const eventData = {
            title: title.trim(),
            shortDescription: shortDescription.trim(),
            fullDescription: fullDescription.trim(),
            author: author.trim(),
            type: type || 'Coming Soon',
            youtubeLink: youtubeLink?.trim() || null,
            eventDate: eventDate ? new Date(eventDate) : null,
            eventTime: eventTime?.trim() || null,
            location: location?.trim() || null,
            speakerType: normalizedSpeakerType,
            speakers,
            image: imageUrl,
            isPublished: true,
            publishedAt: new Date()
        };

        console.log('📝 Creating event with data:', {
            title: eventData.title,
            author: eventData.author,
            type: eventData.type,
            hasImage: !!eventData.image,
            hasYoutubeLink: !!eventData.youtubeLink
        });

        const event = new Event(eventData);
        await event.save();
        
        console.log('✅ Event created successfully with ID:', event._id);

        res.json({ 
            success: true, 
            message: "Event created successfully! ✅", 
            data: event 
        });

    } catch (error) {
        console.error('❌ Create Event Error:', error);
        console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
        

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.json({
                success: false,
                message: messages.join(', ')
            });
        }

        // Handle Cloudinary errors
        if (error.http_code) {
            return res.json({
                success: false,
                message: `Cloudinary error: ${error.message}`
            });
        }

        // Handle file system errors
        if (error.code === 'ENOENT') {
            return res.json({
                success: false,
                message: 'File not found. Please try uploading again.'
            });
        }

        res.json({ success: false, message: `Server error: ${error.message}` });
    }
};

// Get All Events
const getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const events = await Event.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Event.countDocuments({});
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: events,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.json({ success: false, message: 'Failed to fetch events' });
    }
};

// Get Events by Type
const getEventsByType = async (req, res) => {
    try {
        const { type } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const events = await Event.find({ 
            isPublished: true,
            type: type === 'coming-soon' ? 'Coming Soon' : 'Past Event'
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Event.countDocuments({ 
            isPublished: true,
            type: type === 'coming-soon' ? 'Coming Soon' : 'Past Event'
        });
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: events,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching events by type:', error);
        res.json({ success: false, message: 'Failed to fetch events' });
    }
};

// Get Event by ID
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);

        if (!event) {
            return res.json({ success: false, message: 'Event not found' });
        }

        // Increment view count
        event.views += 1;
        await event.save();

        res.json({ success: true, data: event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.json({ success: false, message: 'Failed to fetch event' });
    }
};

// Update Event
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, shortDescription, fullDescription, author, type, youtubeLink, eventDate, eventTime, location, speakerType } = req.body;

        const normalizedSpeakerType = speakerType === 'multiple' ? 'multiple' : 'single';
        const speakers = normalizeSpeakers(req.body.speakers, normalizedSpeakerType);

        if (!speakers.length) {
            return res.json({
                success: false,
                message: "Please provide at least one speaker name"
            });
        }

        const updateData = {
            title: title?.trim(),
            shortDescription: shortDescription?.trim(),
            fullDescription: fullDescription?.trim(),
            author: author?.trim(),
            type: type,
            youtubeLink: youtubeLink?.trim() || null,
            eventDate: eventDate ? new Date(eventDate) : null,
            eventTime: eventTime?.trim() || null,
            location: location?.trim() || null,
            speakerType: normalizedSpeakerType,
            speakers
        };

        // Handle file update if new file is uploaded
        if (req.file) {
            if (req.file.fieldname === 'image' && req.file.mimetype.startsWith('image/')) {
                const result = await cloudinary.uploader.upload(
                    `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, 
                    { 
                        resource_type: 'image',
                        folder: 'irisehub/events'
                    }
                );
                updateData.image = result.secure_url;
            }
        }

        const event = await Event.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!event) {
            return res.json({ success: false, message: "Event not found" });
        }

        res.json({ 
            success: true, 
            message: "Event updated successfully! ✅", 
            data: event 
        });

    } catch (error) {
        console.log('Update Event Error:', error);

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.json({ success: false, message: error.message || 'Failed to update event' });
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await Event.findByIdAndDelete(id);

        if (!event) {
            return res.json({ success: false, message: "Event not found" });
        }

        res.json({ 
            success: true, 
            message: "Event deleted successfully! ✅" 
        });

    } catch (error) {
        console.log('Delete Event Error:', error);
        res.json({ success: false, message: error.message || 'Failed to delete event' });
    }
};

// Toggle Publish Status
const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await Event.findById(id);
        if (!event) {
            return res.json({ success: false, message: "Event not found" });
        }

        event.isPublished = !event.isPublished;
        event.publishedAt = event.isPublished ? new Date() : null;
        await event.save();

        res.json({ 
            success: true, 
            message: `Event ${event.isPublished ? 'published' : 'unpublished'} successfully! ✅`,
            data: event
        });

    } catch (error) {
        console.log('Toggle Publish Error:', error);
        res.json({ success: false, message: error.message || 'Failed to toggle publish status' });
    }
};

export {
    addEvent,
    getAllEvents,
    getEventsByType,
    getEventById,
    updateEvent,
    deleteEvent,
    togglePublish
};
