// pages/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import withAuth from '@/hoc/withAuth';

const DashBoard = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchUser();
    fetchDocuments();
  }, []);


  const fetchUser = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Profile error');
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error('Lỗi lấy thông tin user:', err);
        
      }
    };

    // Fetch danh sách tài liệu
    const fetchDocuments = async () => {
      try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          console.warn('Dữ liệu trả về không phải mảng:', data);
          setDocuments([]);
        }
      } catch (error) {
        console.error('Lỗi fetch documents:', error);
        setDocuments([]);
      }
    };


  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      // Nếu không có file, hiển thị hộp thoại thông báo
      alert('Vui lòng chọn file để upload');
      return;
    }
    // Debug: in ra file được chọn
    console.log('Uploading file:', file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('userId', user?.id || 1);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert('File uploaded successfully');
        // Cập nhật danh sách tài liệu sau khi upload thành công
        setDocuments((prev) => [...prev, data.document]);
        setTitle('');
        setDescription('');
        setFile(null);
      } else {
        alert(data.message || 'Upload thất bại');
      }
    } catch (error) {
      console.error('Lỗi upload:', error);
      alert('Upload thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này không?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Document deleted successfully');
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } else {
        alert('Xóa tài liệu thất bại');
      }
    } catch (error) {
      console.error('Lỗi xóa document:', error);
      alert('Xóa tài liệu thất bại');
    }
  };

  const handleDownload = async (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('http')) {
    alert('Lỗi: URL không hợp lệ');
    return;
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Lỗi khi tải file');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = fileUrl.split('/').pop(); // Lấy tên file từ URL
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('❌ Lỗi download:', error);
    alert('Tải xuống thất bại');
  }
};


  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </nav>

      {/* Profile */}
      <div className="max-w-3xl mx-auto mt-6 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p className="mt-2">
          <strong>Email:</strong> {user.email}
        </p>
      </div>

      {/* Form Upload */}
      <div className="max-w-3xl mx-auto mt-6 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Upload New Document</h2>
        <form onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Upload
          </button>
        </form>
      </div>

      {/* Danh sách tài liệu */}
      <div className="max-w-3xl mx-auto mt-6 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Uploaded Documents</h2>
        {documents.length > 0 ? (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className="border-b border-gray-200 py-4">
                <h3 className="text-xl font-semibold">{doc.title}</h3>
                <p className="mt-2">{doc.description}</p>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleDownload(doc.fileUrl)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Chưa có tài liệu nào được upload.</p>
        )}
      </div>
    </div>
  );
}

export default withAuth(DashBoard);