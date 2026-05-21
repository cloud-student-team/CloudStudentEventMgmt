const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

require('dotenv').config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const registrationRoutes = require('./routes/registrations');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const { startReminderCron } = require('./utils/reminderCron');

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Cloud Student Event Management API is running');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startReminderCron(); // Start the daily reminder job
