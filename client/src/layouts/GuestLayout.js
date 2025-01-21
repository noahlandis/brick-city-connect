import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import { Outlet } from 'react-router-dom';

function GuestLayout() {
  const isMobile = window.innerWidth <= 600; // Match MUI's 'sm' breakpoint

  return (
    <div 
      className="flex items-center justify-center min-h-screen"
      style={{ 
        backgroundImage: isMobile ? 'none' : 'url("/rit.jpg")',
        backgroundColor: 'white',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      <Card
        sx={{
          backgroundColor: "white",
          pt: { xs: 1, sm: 2 },  // More top padding on mobile
          px: { xs: 3, sm: 2 },  // More horizontal padding on mobile
          boxShadow: { xs: 0, sm: 3 }, // Remove shadow on mobile
          width: {
            xs: '100%',
            sm: 'auto'
          },
          height: {
            xs: '100vh', // Full viewport height on mobile
            sm: 'auto'
          },
          margin: {
            xs: 0,
            sm: 2
          },
          borderRadius: {
            xs: 0,
            sm: 2
          },
          overflow: 'auto',
          display: 'flex',  // Added to help with vertical spacing
          flexDirection: 'column'
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