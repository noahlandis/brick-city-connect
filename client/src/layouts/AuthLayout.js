function AuthLayout({ children }) {
  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundImage: 'url("/rit.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;