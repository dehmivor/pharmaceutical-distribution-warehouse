import Grid from '@mui/material/Grid';

import AnalyticsOverviewCard from '@/sections/dashboard/AnalyticsOverviewCard';
import AnalyticsOverviewChart from '@/sections/dashboard/AnalyticsOverviewChart';
import AnalyticsTopRef from '@/sections/dashboard/AnalyticsTopRef';
import SupervisorRecentActivity from '@/sections/dashboard/SupervisorRecentActivity';

export default function AnalyticsOverview() {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <AnalyticsOverviewCard />
      </Grid>
      <Grid size={12}>
        <AnalyticsOverviewChart />
      </Grid>
      <Grid size={12} md={8}>
        <AnalyticsTopRef />
      </Grid>
      <Grid size={12} md={4}>
        <SupervisorRecentActivity />
      </Grid>
    </Grid>
  );
}
