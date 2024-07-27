const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const serverless = require('serverless-http');
const app = express();

// Middleware
app.use(bodyParser.json());

const allowedOrigins = [
  'https://farme-manager.netlify.app',
  'https://main--farme-manager.netlify.app',
  'http://localhost:3000'
];

app.use(cors((req, callback) => {
  let corsOptions;
  if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
    corsOptions = {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
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
  name: { type: String, required: true },
  location: { type: String, required: true },
  area: { type: Number, required: true },
  chickens: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  spent_com: { type: String, default: ' ' },
  earnings: { type: Number, default: 0 },
  earnings_com: { type: String, default: ' ' },
  profit: { type: Number, default: 0 },
  turnover: { type: Number, default: 0 }
});

const logSchema = new mongoose.Schema({
  user: String,
  ip: String,
  action: String,
  date: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const Farm = mongoose.model('Farm', farmSchema);
const Log = mongoose.model('Log', logSchema);
const Task = mongoose.model('Task', TaskSchema);

// Routes

// task route
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  const { description, dueDate } = req.body;
  const task = new Task({
    description,
    dueDate
  });

  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a specific task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { description, dueDate, completed } = req.body;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    if (typeof completed === 'boolean') {
      task.completed = completed;
    }
    task.updatedAt = Date.now();

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      console.error('Task not found:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }
    console.log('Task deleted successfully:', req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: err.message });
  }
});

// end of task route.

// farm route.
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

// end of farm route

// financials route
app.get('/api/financials', async (req, res) => {

  try {
    const farms = await Farm.find();
    const financials = farms.map(farm => ({
      user: Log.user,
      ip: Log.ip,
      spent: farm.spent,
      earnings: farm.earnings,
      spent_com: farm.spent_com,
      earnings_com: farm.earnings_com,
      profit: farm.profit,
      turnover: farm.turnover
    }));
    res.json(financials);
  } catch (error) {
    console.error('Error fetching financials:', error);
    res.status(500).json({ error: 'Failed to fetch financials' });
  }
});

app.put('/api/farms/:id/financials', async (req, res) => {
  const { id } = req.params;
  const { spent, earnings, spent_com, earnings_com, user } = req.body;

  console.log('Received update financials request:', {
      id,
      spent,
      earnings,
      spent_com,
      earnings_com,
      user
  });

  // Check if required fields are provided
  if (typeof spent !== 'number' || typeof earnings !== 'number' || !spent_com || !earnings_com) {
      console.error('Validation error: Spent, earnings, spent_com, and earnings_com are required and must be numbers');
      return res.status(400).json({ error: 'Spent, earnings, spent_com, and earnings_com are required and must be numbers' });
  }

  try {
      const farm = await Farm.findById(id);
      if (!farm) {
          console.error('Farm not found for ID:', id);
          return res.status(404).json({ error: 'Farm not found' });
      }

      console.log('Farm data before update:', {
          id: farm._id,
          spent: farm.spent,
          earnings: farm.earnings,
          profit: farm.profit,
          turnover: farm.turnover
      });

      // Update farm financials
      farm.spent += spent || 0;
      farm.earnings += earnings || 0;
      farm.profit = farm.earnings - farm.spent;
      farm.turnover += earnings || 0;

      // Also update the `spent_com` and `earnings_com` fields
      farm.spent_com = spent_com;
      farm.earnings_com = earnings_com;

      const updatedFarm = await farm.save();

      console.log('Farm data after update:', {
          id: updatedFarm._id,
          spent: updatedFarm.spent,
          earnings: updatedFarm.earnings,
          profit: updatedFarm.profit,
          turnover: updatedFarm.turnover
      });

      // Save log record
      const financialLog = new Log({
          user: user || 'Unknown',
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          action: `Updated financials for farm ${farm.name}: Spent ${spent}, Earnings ${earnings}`,
          date: new Date()
      });

      await financialLog.save();

      res.json(updatedFarm);
  } catch (error) {
      console.error('Error updating financials:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Failed to update financials' });
  }
});

// end of financials route.

// logs route.
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

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

// end of logs route

if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} else {
  module.exports.handler = serverless(app);
}
