import React from 'react';
import { AppBar, Toolbar, Typography, TextField, Button, Container, Box } from '@mui/material';

const SupportPage = () => {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Support Page
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Contact Support
        </Typography>
        <Typography variant="body1" gutterBottom>
          If you have any questions or issues, please fill out the form below, and we'll get back to you as soon as possible.
        </Typography>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <TextField fullWidth label="Your Name" margin="normal" />
          <TextField fullWidth label="Your Email" margin="normal" />
          <TextField fullWidth label="Message" multiline rows={4} margin="normal" />
          <Button variant="contained" color="primary" sx={{ mt: 2 }}>
            Submit
          </Button>
        </Box>
      </Container>
    </div>
  );
};

export default SupportPage;
