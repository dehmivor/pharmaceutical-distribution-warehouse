import React from "react";
import { Button, Stack } from "@mui/material";
import { styled } from "@mui/system";

const WhiteButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#ffffff",
  color: "#000000",
  border: "1px solid #ccc",
  "&:hover": {
    backgroundColor: "#f0f0f0",
  },
}));

const RedButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#f44336",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#d32f2f",
  },
}));

const BlueButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#2196f3",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#1976d2",
  },
}));

const GreenButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#4caf50",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#388e3c",
  },
}));

function Design() {
  return (
    <Stack spacing={2} p={4}>
      <Button variant="contained" color="primary">
        Primary Button
      </Button>
      <WhiteButton variant="contained">White Button</WhiteButton>
      <RedButton variant="contained">Red Button</RedButton>
      <BlueButton variant="contained">Blue Button</BlueButton>
      <GreenButton variant="contained">Green Button</GreenButton>
    </Stack>
  );
}

export default Design;
