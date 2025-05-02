const WarningFlight = require('../models/AlertFlights');


exports.getWarnings = async (req, res) => {
  try {
    const warnings = await WarningFlight.find()
      .sort({ Created_at: -1 });
    res.status(200).json(warnings);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching flight warnings', 
      error: error.message 
    });
  }
};


exports.createWarning = async (req, res) => {
  try {
    const newWarning = new WarningFlight({
      area: req.body.area,
      Content: req.body.Content,
      Propose: req.body.Propose,
      level: req.body.level || 'medium',
      Created_at: new Date()
    });

    const savedWarning = await newWarning.save();
    res.status(201).json(savedWarning);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating flight warning', 
      error: error.message 
    });
  }
};


exports.updateWarning = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedWarning = await WarningFlight.findByIdAndUpdate(
      id,
      {
        Number_Flight: req.body.Number_Flight,
        Content: req.body.Content,
        Propose: req.body.Propose,
        level: req.body.level
      },
      { new: true }
    );

    if (!updatedWarning) {
      return res.status(404).json({ message: 'Warning not found' });
    }

    res.status(200).json(updatedWarning);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating flight warning', 
      error: error.message 
    });
  }
};


exports.deleteWarning = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedWarning = await WarningFlight.findByIdAndDelete(id);

    if (!deletedWarning) {
      return res.status(404).json({ message: 'Warning not found' });
    }

    res.status(200).json({ message: 'Warning deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting flight warning', 
      error: error.message 
    });
  }
};


exports.getWarningStats = async (req, res) => {
  try {
    const stats = await WarningFlight.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    const statistics = {
      high: 0,
      medium: 0,
      low: 0
    };

    stats.forEach(stat => {
      statistics[stat._id] = stat.count;
    });

    res.status(200).json(statistics);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching warning statistics', 
      error: error.message 
    });
  }
};

exports.createFlight = async (req, res) => {
    try {
        const { 
            Number_Flight, 
            Pilot_email, 
            Plane, 
            From, 
            Transit, 
            To, 
            Time_depart, 
            Time_landing, 
            Gate_depart,
            Initial_price,
            Current_price,
            Status 
        } = req.body;

        // Create a new flight
        const flight = new Flight({
            Number_Flight,
            Pilot_email,
            Plane,
            From,
            Transit,
            To,
            Time_depart,
            Time_landing,
            Gate_depart,
            Initial_price: Initial_price,
            Current_price: Current_price ?? Initial_price,
            Status: Status || 'On Schedule'
        });

        await flight.save();
        res.status(201).json(flight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFlight = async (req, res) => {
    try {
        const { 
            Number_Flight, 
            Pilot_email, 
            Plane, 
            From, 
            Transit, 
            To, 
            Time_depart, 
            Time_landing, 
            Gate_depart,
            Initial_price,
            Current_price,
            Status 
        } = req.body;

        const flight = await Flight.findById(req.params.id);
        
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // Update flight fields
        flight.Number_Flight = Number_Flight || flight.Number_Flight;
        flight.Pilot_email = Pilot_email || flight.Pilot_email;
        flight.Plane = Plane || flight.Plane;
        flight.From = From || flight.From;
        flight.Transit = Transit || flight.Transit;
        flight.To = To || flight.To;
        flight.Time_depart = Time_depart || flight.Time_depart;
        flight.Time_landing = Time_landing || flight.Time_landing;
        flight.Gate_depart = Gate_depart || flight.Gate_depart;
        flight.Initial_price = Initial_price || flight.Initial_price;
        flight.Current_price = Current_price || flight.Current_price;
        flight.Status = Status || flight.Status;

        await flight.save();
        res.status(200).json(flight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFlightPricesDueToWeather = async (req, res) => {
  try {
      const { flightIds, discountFactor, weatherAlertId } = req.body;
      
      // Cập nhật giá vé cho các chuyến bay bị ảnh hưởng
      const updatePromises = flightIds.map(id => 
          Flight.findByIdAndUpdate(id, 
              { 
                  $mul: { Current_price: discountFactor } 
              },
              { new: true }
          )
      );
      
      const updatedFlights = await Promise.all(updatePromises);
      
      // Lưu log về việc điều chỉnh giá
      await Alert.findByIdAndUpdate(weatherAlertId, {
          $push: { affectedFlightPrices: { flightIds, discountFactor, appliedAt: new Date() } }
      });
      
      return res.status(200).json({
          success: true,
          message: `Updated prices for ${updatedFlights.length} flights due to weather alert`,
          data: updatedFlights
      });
  } catch (error) {
      console.error('Error updating flight prices:', error);
      return res.status(500).json({
          success: false,
          message: 'Failed to update flight prices',
          error: error.message
      });
  }
};