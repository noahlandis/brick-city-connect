function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{ backgroundImage: 'url("/rit.jpg")' }}>
      <div className="bg-[#F76902] p-8 rounded-lg shadow-lg">
        <div className="flex justify-center mb-6">
          <img 
            src="/tiger.png" 
            alt="RIT Tiger Logo" 
            className="w-32 h-32"
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
