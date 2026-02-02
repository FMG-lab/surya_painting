import Link from 'next/link';
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <div className="font-bold">Surya Painting — Admin</div>
          <nav className="space-x-4">
            <Link className="text-sky-600" href="/payments">Payments</Link>
            <Link className="text-sky-600" href="/bookings">Bookings</Link>
            <Link className="text-sky-600" href="/branches">Branches</Link>
            <Link className="text-sky-600" href="/users">Users</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto py-6">{children}</main>
    </div>
  );
};

export default Layout;
