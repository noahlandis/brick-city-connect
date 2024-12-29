function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{ backgroundImage: 'url("/rit.jpg")' }}>
      <div className="card bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center gap-4">
          <img 
            src="/tiger.png" 
            alt="RIT Tiger Logo" 
            className="w-32 h-32"
          />
          <div className="card-title text-[#F76902] font-helvetica text-2xl">Brick City Connect</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
