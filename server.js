// server.js
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import path from 'path';

config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tbyktsmtfzqvxoibhusv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieWt0c210ZnpxdnhvaWJodXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDUxMTQsImV4cCI6MjA2ODI4MTExNH0.HxC38CbyAHnBpNpGoTTCHHMOP1p3A-A1rHbv1Jsb6Fg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static('.'));

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure Gemini API
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in the .env file. Please set it.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Define a map for issue types to be used in prompts if needed, or rely on frontend labels
const issueTypeMapping = {
  dirty_restroom: "Dirty restroom",
  overflowing_bin: "Overflowing bin",
  no_dispenser: "No dispenser",
  no_water: "No water",
  safety_concern: "Safety concern",
  other: "Other",
};

/**
 * Helper function to generate priority using Gemini API
 * @param {string} issueType
 * @param {string} location
 * @param {string} description
 * @returns {Promise<string>}
 */
async function generatePriority(issueType, location, description) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Given an issue report with the following details:
Issue Type: ${issueTypeMapping[issueType] || issueType}
Location: ${location}
Description: ${description || 'N/A'}

Please categorize the priority of this issue as either 'Green', 'RED', or 'Blue'. Only output one of these three words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();

    // Check if the response contains any of the expected priorities
    if (text.includes("RED")) {
      return "RED";
    } else if (text.includes("GREEN")) {
      return "GREEN";
    } else if (text.includes("BLUE")) {
      return "BLUE";
    } else {
      console.warn(`Gemini returned an unexpected priority: ${text}. Defaulting to BLUE.`);
      return "BLUE"; // Default to a low priority if unexpected output
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "BLUE"; // Default to a low priority on error
  }
}

// API endpoint for generating priority
app.post('/generate-priority', async (req, res) => {
  const { issueType, location, description } = req.body;

  if (!issueType || !location) {
    return res.status(400).json({ error: "Issue type and location are required." });
  }

  try {
    const priority = await generatePriority(issueType, location, description);
    res.json({ priority });
  } catch (error) {
    console.error("Failed to generate priority:", error);
    res.status(500).json({ error: "Failed to generate priority." });
  }
});

// API endpoint to retrieve all issues from Supabase
app.get('/api/issues', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ issues: data || [] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to fetch issues.' });
  }
});

// API endpoint to retrieve all facilities from Supabase
app.get('/api/facilities', async (req, res) => {
    try {
        console.log('Fetching facilities from Supabase...');
        const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Supabase facilities fetch error:', error);
            // Return hardcoded data as fallback
            return res.json({
                facilities: [
                    {
                        facility_id: "79439ae2-5361-4332-9832-d1569aafb861",
                        name: "Hygiene Station",
                        building: "Sports Complex",
                        floor: "1F",
                        room_number: null
                    },
                    {
                        facility_id: "8c53dd4e-8d97-4b1f-885f-76078bf9fac6",
                        name: "Girls' Washroom",
                        building: "Main Block",
                        floor: "1F",
                        room_number: null
                    },
                    {
                        facility_id: "e76dbc24-c029-4ed6-8a5b-86e7c8ef95ce",
                        name: "Sanitary Pad Dispenser",
                        building: "Library",
                        floor: "Ground",
                        room_number: null
                    }
                ]
            });
        }

        console.log('Facilities data from Supabase:', data);
        res.json({ facilities: data || [] });
    } catch (err) {
        console.error('Server error when fetching facilities:', err);
        // Return hardcoded data as fallback
        res.json({
            facilities: [
                {
                    facility_id: "79439ae2-5361-4332-9832-d1569aafb861",
                    name: "Hygiene Station",
                    building: "Sports Complex",
                    floor: "1F",
                    room_number: null
                },
                {
                    facility_id: "8c53dd4e-8d97-4b1f-885f-76078bf9fac6",
                    name: "Girls' Washroom",
                    building: "Main Block",
                    floor: "1F",
                    room_number: null
                },
                {
                    facility_id: "e76dbc24-c029-4ed6-8a5b-86e7c8ef95ce",
                    name: "Sanitary Pad Dispenser",
                    building: "Library",
                    floor: "Ground",
                    room_number: null
                }
            ]
        });
    }
});

// API endpoint to update an issue
app.put('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  const { status, action_remarks } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Issue ID is required.' });
  }
  
  try {
    // Update the issue in Supabase
    const { data, error } = await supabase
      .from('issues')
      .update({
        status: status,
        action_remarks: action_remarks
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (data && data.length > 0) {
      res.json({ issue: data[0] });
    } else {
      res.status(404).json({ error: 'Issue not found.' });
    }
  } catch (err) {
    console.error('Server error when updating issue:', err);
    res.status(500).json({ error: 'Failed to update issue.' });
  }
});

// Basic route for testing server status
app.get('/', (req, res) => {
  res.send('Gemini Proxy Server is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Gemini Proxy Server listening at http://localhost:${port}`);
}); 
// POST /api/issues (with image upload)
app.post('/api/issues', upload.single('image'), async (req, res) => {
  try {
    const { issue_type, description, facility_id } = req.body;
    if (!issue_type || !facility_id) {
      return res.status(400).json({ error: 'issue_type and facility_id are required.' });
    }

    // Generate priority using Gemini
    let geminiPriority = 'BLUE';
    try {
      geminiPriority = await generatePriority(issue_type, facility_id, description);
    } catch (e) {
      console.warn('Gemini priority generation failed, defaulting to BLUE:', e);
    }
    let priority = 'Medium';
    if (geminiPriority === 'RED') priority = 'Critical';
    else if (geminiPriority === 'GREEN') priority = 'High';
    else if (geminiPriority === 'BLUE') priority = 'Low';

    // Handle image upload to Supabase Storage
    let image_url = null;
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `issue_${Date.now()}${fileExt}`;
      const { data, error } = await supabase.storage
        .from('issue-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
      if (error) {
        console.error('Supabase Storage upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image.' });
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('issue-images')
        .getPublicUrl(fileName);
      image_url = publicUrlData.publicUrl;
    }

    // Insert into Supabase with mapped priority, status 'Reported', and image_url
    const { data, error } = await supabase
      .from('issues')
      .insert([
        {
          issue_type,
          description,
          facility_id,
          status: 'Reported',
          priority,
          image_url
        },
      ])
      .select();
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ message: 'Issue submitted successfully', data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to submit issue.' });
  }
});