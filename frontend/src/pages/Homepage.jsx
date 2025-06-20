import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome to MyGPT  
        <span className="text-blue-500">Your AI Agent Maker</span>
      </h1>
      <Link to="/login" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Login
      </Link>
    </div>
  );
};

export default Homepage;
