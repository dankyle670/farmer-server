const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schema and model
const farmSchema = new mongoose.Schema({
  name: String,
  location: String,
  area: Number,
  chickens: Number
});

const Farm = mongoose.model('Farm', farmSchema);

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
    res.status(201).json(savedFarm);
  } catch (error) {
    console.error('Error creating farm:', error);
    res.status(500).json({ error: 'Failed to create farm' });
  }
});

app.put('/api/farms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedFarm = await Farm.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedFarm);
  } catch (error) {
    console.error('Error updating farm:', error);
    res.status(500).json({ error: 'Failed to update farm' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


//const express = require('express');
//const mongoose = require('mongoose');
//const bodyParser = require('body-parser');
//const cors = require('cors');
//
//const app = express();
//const port = process.env.PORT || 5000;
//
//// Middleware
//app.use(bodyParser.json());
//app.use(cors());
//
//// MongoDB connection
//const uri = 'mongodb+srv://jdanielkom:1PhU4kEdZnDAECN5@cluster0.tw4eyui.mongodb.net/';
//mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
//  .then(() => console.log('MongoDB connected'))
//  .catch(err => console.log(err));
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
//  const farms = await Farm.find();
//  res.json(farms);
//});
//
//app.post('/api/farms', async (req, res) => {
//  const newFarm = new Farm(req.body);
//  const savedFarm = await newFarm.save();
//  res.json(savedFarm);
//});
//
//app.put('/api/farms/:id', async (req, res) => {
//  const { id } = req.params;
//  const { name, location, area, chickens } = req.body;
//
//  try {
//    const updatedFarm = await Farm.findByIdAndUpdate(id, { name, location, area, chickens }, { new: true });
//    res.json(updatedFarm);
//  } catch (error) {
//    console.error('Error updating farm:', error);
//    res.status(500).json({ error: 'Failed to update farm' });
//  }
//});
//
//app.listen(port, () => {
//  console.log(`Server running on port ${port}`);
//});
