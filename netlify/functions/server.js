const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(bodyParser.json());

const allowedOrigins = ['https://farme-manager.netlify.app', 'https://main--farme-manager.netlify.app', 'http://localhost:3000'];
app.use(cors((req, callback) => {
  let corsOptions;
  if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
}));

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not defined');
} else {
  console.log(`Connecting to MongoDB with URI: ${uri}`);
}
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
  });

// Define schema and model
const farmSchema = new mongoose.Schema({
  name: String,
  location: String,
  area: Number,
  chickens: Number
});

const logSchema = new mongoose.Schema({
  user: String,
  ip: String,
  action: String,
  date: { type: Date, default: Date.now }
});

const Farm = mongoose.model('Farm', farmSchema);
const Log = mongoose.model('Log', logSchema);

// Routes
app.get('/api/farms', async (req, res) => {
  try {
    const farms = await Farm.find();
    res.json(farms);
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

app.post('/api/farms', async (req, res) => {
  try {
    const newFarm = new Farm(req.body);
    const savedFarm = await newFarm.save();
    logAction(req, 'Create New Farm');
    res.status(201).json(savedFarm);
  } catch (error) {
    console.error('Error creating farm:', error);
    res.status(500).json({ error: 'Failed to create farm' });
  }
});

app.delete('/api/farms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Farm.findByIdAndDelete(id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({ error: 'Failed to delete farm' });
  }
});

const logAction = async (req, actionDescription) => {
  const logData = {
    user: req.body.user || 'Unknown', // Adjust as needed to fetch user details
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    action: actionDescription
  };

  try {
    const newLog = new Log(logData);
    await newLog.save();
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

app.post('/api/logs', async (req, res) => {
  try {
    const newLog = new Log(req.body);
    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    console.error('Error logging action:', error);
    res.status(500).json({ error: 'Failed to log action' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} else {
  // Export the handler for Netlify Functions
  module.exports.handler = serverless(app);
}


//const express = require('express');
//const mongoose = require('mongoose');
//const bodyParser = require('body-parser');
//const cors = require('cors');
//require('dotenv').config();
//const serverless = require('serverless-http');
//
//const app = express();
//
//// Debugging to check if the environment variable is loaded
//console.log('MONGODB_URI:', process.env.MONGODB_URI);
//
//// Middleware
//app.use(bodyParser.json());
//
//const allowedOrigins = ['https://farme-manager.netlify.app', 'https://main--farme-manager.netlify.app', 'http://localhost:3000'];
//
//app.use(cors((req, callback) => {
//  let corsOptions;
//  if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
//    corsOptions = { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] };
//  } else {
//    corsOptions = { origin: false };
//  }
//  callback(null, corsOptions);
//}));
//
//// MongoDB connection
//const uri = process.env.MONGODB_URI;
//if (!uri) {
//  console.error('MONGODB_URI is not defined');
//} else {
//  console.log(`Connecting to MongoDB with URI: ${uri}`);
//}
//mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
//  .then(() => console.log('MongoDB connected'))
//  .catch(err => {
//    console.error('MongoDB connection error:', err);
//    console.error('Error details:', JSON.stringify(err, null, 2));
//  });
//
//// Define schema and model
//const farmSchema = new mongoose.Schema({
//  name: String,
//  location: String,
//  area: Number,
//  chickens: Number
//});
//
//const Farm = mongoose.model('Farm', farmSchema);
//
//// Routes
//app.get('/api/farms', async (req, res) => {
//  try {
//    const farms = await Farm.find();
//    res.json(farms);
//  } catch (error) {
//    console.error('Error fetching farms:', error);
//    res.status(500).json({ error: 'Failed to fetch farms' });
//  }
//});
//
//app.post('/api/farms', async (req, res) => {
//  try {
//    const newFarm = new Farm(req.body);
//    const savedFarm = await newFarm.save();
//    res.status(201).json(savedFarm);
//  } catch (error) {
//    console.error('Error creating farm:', error);
//    res.status(500).json({ error: 'Failed to create farm' });
//  }
//});
//
//app.put('/api/farms/:id', async (req, res) => {
//  const { id } = req.params;
//  try {
//    const updatedFarm = await Farm.findByIdAndUpdate(id, req.body, { new: true });
//    res.json(updatedFarm);
//  } catch (error) {
//    console.error('Error updating farm:', error);
//    res.status(500).json({ error: 'Failed to update farm' });
//  }
//});
//
//app.delete('/api/farms/:id', async (req, res) => {
//  const { id } = req.params;
//  try {
//    await Farm.findByIdAndDelete(id);
//    res.status(204).end();
//  } catch (error) {
//    console.error('Error deleting farm:', error);
//    res.status(500).json({ error: 'Failed to delete farm' });
//  }
//});
//
//
//if (process.env.NODE_ENV === 'development') {
//  const PORT = process.env.PORT || 5000;
//  app.listen(PORT, () => {
//    console.log(`Server is running on http://localhost:${PORT}`);
//  });
//} else {
//  // Export the handler for Netlify Functions
//  module.exports.handler = serverless(app);
//}
