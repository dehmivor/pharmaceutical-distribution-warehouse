import { Button, Stack } from "@mui/material";
import { styled } from "@mui/system";

const CreamButton = styled(Button)({
  backgroundColor: "#FCFAEE",
  color: "#384B70",
  border: "1px solid #ccc",
  "&:hover": {
    backgroundColor: "#f2f0e2",
  },
});

const RedButton = styled(Button)({
  backgroundColor: "#B8001F",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#99001a",
  },
});

const DarkBlueButton = styled(Button)({
  backgroundColor: "#384B70",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#2f3f5e",
  },
});

const MidBlueButton = styled(Button)({
  backgroundColor: "#507687",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#40616f",
  },
});

function CustomButton() {
  return (
    <Stack spacing={2}>
      <DarkBlueButton variant="contained">Dark Blue Button</DarkBlueButton>
      <MidBlueButton variant="contained">Mid Blue Button</MidBlueButton>
      <CreamButton variant="contained">Cream Button</CreamButton>
      <RedButton variant="contained">Red Button</RedButton>
    </Stack>
  );
}

export default CustomButton;
