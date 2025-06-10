module.exports = (req, res, next) => {
    req.user = {
      _id: '60a1234567890abcdef12345', // ID giả định của supervisor
      role: 'supervisor',
      name: 'Fake Supervisor'
    };
    next();
  };