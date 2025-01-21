import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import { Outlet } from 'react-router-dom';

function GuestLayout() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-center bg-no-repeat bg-cover" style={{ backgroundImage: 'url("/rit.jpg")' }}>
       <Card
      sx={{
        backgroundColor: "white",
        pt: 2,
        px: 2,
        boxShadow: 3,
        width: {
          xs: '100%',  // Full width on mobile
          sm: 'auto'   // Default width on larger screens
        },
        height: {
          xs: '100vh', // Full height on mobile
          sm: 'auto'   // Default height on larger screens
        },
        margin: {
          xs: 0,       // No margin on mobile
          sm: 2        // Normal margin on larger screens
        },
        borderRadius: {
          xs: 0,       // No border radius on mobile
          sm: 2        // Normal border radius on larger screens
        }
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            src="/tiger.png"
            alt="RIT Tiger Logo"
            sx={{
              width: 80,
              height: 80,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: "#F76902",
              fontFamily: '"Helvetica Neue"',
              fontWeight: 'bold',
              fontSize: {
                xs: '1.5rem',
                sm: '1.8rem'
              },
              whiteSpace: 'nowrap',
            }}
          >
            Brick City Connect
          </Typography>
        </Box>
        <Outlet />
      </CardContent>
    </Card>
    </div>
  );
}

export default GuestLayout;