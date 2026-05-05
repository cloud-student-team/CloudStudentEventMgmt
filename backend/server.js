const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();


require('dotenv').config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

const userRoutes = require('./routes/users.js');
const registrationRoutes = require('./routes/registrations');

console.log('userRoutes loaded:', typeof userRoutes);



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.get('/', (req, res) => {
  res.send('Cloud Student Event Management API is running🚀');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

