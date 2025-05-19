export default function LoginLayout({ children }) {
  return (
    <html lang="vi">
      <body className="flex items-center justify-center h-screen bg-gray-100">
        <div className="w-full max-w-md p-6 bg-white rounded shadow-md">
          {children}
        </div>
      </body>
    </html>
  );
}
