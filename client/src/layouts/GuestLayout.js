import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import { Outlet } from 'react-router-dom';

function GuestLayout() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-center bg-no-repeat bg-cover" style={{ backgroundImage: 'url("/rit.jpg")' }}>
       <Card
      sx={{
        backgroundColor: "white",
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
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
              fontSize: '1.8rem',
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