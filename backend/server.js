const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json()); // login

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Import routes
const flightRoutes = require('./routes/Flight');
const userRoutes = require('./routes/userRoutes');
const authRouter = require('./routes/Login'); 
const alertRoutes = require('./routes/alertRoutes');
const alertFlights = require('./routes/flightsRoutes');
const reportsRouter = require('./routes/reports')
const weatherRoutes = require('./routes/weatherRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const FlightBooking = require('./routes/FlightBooking');

app.use('/flights', flightRoutes);
app.use('/users', userRoutes);
app.use('/login', authRouter); 
app.use('/alerts', alertRoutes);
app.use('/alertsflights', alertFlights);
app.use('/reports', reportsRouter);
app.use('/weather', weatherRoutes);
app.use('/incidents', incidentRoutes);
app.use('/FlightBooking', FlightBooking);
app.use(cors({ origin: '*' }));

// Kết nối MongoDB
mongoose.connect('mongodb+srv://admin1:a67RqW9HDY8Fj4Sh@cluster0.nyw26.mongodb.net/Airport_Weather?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Khởi chạy server
app.listen(5000, () => console.log('Server đang chạy tại http://localhost:5000'));
