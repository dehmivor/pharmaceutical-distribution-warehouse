import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Button } from '@mui/material';
import { BugReport, ExpandMore } from '@mui/icons-material';

const DebugPanel = ({ orders, apiDebugInfo, onTestParams, onRefresh }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport fontSize="small" />
          <Typography variant="caption">Debug Information (Orders: {orders.length})</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button size="small" onClick={onTestParams} variant="outlined">
            Test Different Params
          </Button>
          <Button size="small" onClick={onRefresh} variant="outlined">
            Refresh Data
          </Button>
        </Box>

        <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto' }}>
          {JSON.stringify(apiDebugInfo, null, 2)}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
};

export default DebugPanel;
