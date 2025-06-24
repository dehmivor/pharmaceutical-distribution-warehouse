const generateOtpData = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  const expiry_time = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  return {
    code,
    expiry_time,
  };
};

module.exports = {
  generateOtpData,
};
