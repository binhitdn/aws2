import axios from "@/lib/axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/profile");
        if (res.data.user) {
          setIsAuthenticated(true); 
          router.replace("/dashboard"); 
        }
      } catch (err) {
        setIsAuthenticated(false); 
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (isAuthenticated) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-100">
      
      <div className="max-w-6xl mx-auto py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          Chào mừng đến với Study Share Platform 📚
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Nền tảng chia sẻ tài liệu học tập dành cho sinh viên.
        </p>
        <div className="mt-8">
          <a
            href="/register"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          >
            Đăng ký ngay
          </a>
          <a
            href="/login"
            className="ml-4 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}
