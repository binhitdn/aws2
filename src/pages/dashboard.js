import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import withAuth from '@/hoc/withAuth';
import axios from '../lib/axios';

const DashBoard = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(''); // Preview file khi upload
  const [docPreviewUrl, setDocPreviewUrl] = useState(''); // Preview tài liệu từ danh sách
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Các state cho chức năng chỉnh sửa tài liệu
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const router = useRouter();

  useEffect(() => {
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

  // Xử lý thay đổi file: tạo preview nếu file là image
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Vui lòng chọn file để upload');
      return;
    }
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
        setDocuments((prev) => [...prev, data.document]);
        setTitle('');
        setDescription('');
        setFile(null);
        setPreviewUrl('');
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

  const handleDownload = async (documentId) => {
    try {
      // Lấy signed URL từ backend
      const res = await axios.get(`/api/documents/download/${documentId}`);
      let { downloadUrl } = res.data;
      if (!downloadUrl) {
        throw new Error('Không nhận được URL tải xuống');
      }
      const s3Prefix = "https://casestudy-001.s3.ap-southeast-1.amazonaws.com/";
      if (downloadUrl.includes("https%3A")) {
        const decoded = decodeURIComponent(downloadUrl);
        const index = decoded.indexOf("uploads/");
        downloadUrl = index !== -1 ? s3Prefix + decoded.substring(index) : decoded;
      }
      // Tải file dạng blob
      const fileResponse = await axios.get(downloadUrl, { responseType: 'blob' });
      if (!fileResponse.data) throw new Error('Không tải được file');
      const blob = fileResponse.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadUrl.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Lỗi download:', error);
      alert('Tải xuống thất bại');
    }
  };

  const startEditing = (doc) => {
    setEditingDocumentId(doc.id);
    setEditTitle(doc.title);
    setEditDescription(doc.description);
  };

  const cancelEditing = () => {
    setEditingDocumentId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Document updated successfully');
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === id ? { ...doc, title: editTitle, description: editDescription } : doc
          )
        );
        cancelEditing();
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Lỗi cập nhật document:', error);
      alert('Cập nhật thất bại');
    }
  };

  const handlePreview = async (doc) => {
    try {
      const res = await fetch(`/api/documents/download/${doc.id}`);
      if (!res.ok) throw new Error('Lỗi khi lấy link preview');
      const data = await res.json();
      if (!data.downloadUrl || typeof data.downloadUrl !== 'string') {
        throw new Error('Không nhận được URL preview hợp lệ');
      }
      let previewUrlFixed = data.downloadUrl;
      if (previewUrlFixed.includes("https%3A")) {
        const decoded = decodeURIComponent(previewUrlFixed);
        const index = decoded.indexOf("uploads/");
        previewUrlFixed = index !== -1 ? "https://casestudy-001.s3.ap-southeast-1.amazonaws.com/" + decoded.substring(index) : decoded;
      }
      setDocPreviewUrl(previewUrlFixed);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Lỗi preview:', error);
      alert('Không thể xem trước tài liệu');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
    localStorage.removeItem('token');
    router.replace('/login');
  };

  // Lọc tài liệu theo từ khóa tìm kiếm
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600">Drive</h1>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile & Upload */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Thông tin cá nhân</h2>
            {user ? (
              <div>
                <p>
                  <span className="font-medium">Tên:</span> {user.name}
                </p>
                <p className="mt-2">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload Tài liệu</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input
                type="text"
                placeholder="Tiêu đề"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
              />
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-full file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {previewUrl && (
                <div className="mb-2">
                  <p className="font-medium">Preview:</p>
                  <img src={previewUrl} alt="Preview" className="max-w-xs rounded shadow" />
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
              >
                Upload
              </button>
            </form>
          </div>
        </section>

        {/* Danh sách tài liệu */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Tài liệu của tôi</h2>
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Xem trước
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Tải xuống
                    </button>
                    <button
                      onClick={() => startEditing(doc)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Chưa có tài liệu nào được upload.</p>
          )}
        </section>
      </main>

      {/* Modal xem trước tài liệu */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white rounded-lg shadow-lg relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-3xl"
            >
              &times;
            </button>
            <div className="p-6">
              {typeof docPreviewUrl === 'string' && docPreviewUrl.length > 0 ? (
                (() => {
                  const ext = docPreviewUrl.split('.').pop().split(/\#|\?/)[0].toLowerCase();
                  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                    return <img src={docPreviewUrl} alt="Document Preview" className="w-full rounded" />;
                  } else if (ext === 'pdf') {
                    return <iframe src={docPreviewUrl} className="w-full h-96 rounded" />;
                  } else {
                    return (
                      <div className="flex flex-col items-center justify-center p-6">
                        <div className="mb-4">
                          <svg
                            className="w-16 h-16 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l10 10M17 7l-10 10" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-4">
                          Không hỗ trợ xem trước cho loại file này
                        </p>
                        <a
                          href={docPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                          Tải về file
                        </a>
                      </div>
                    );
                  }
                })()
              ) : (
                <p className="text-center text-gray-600">Không có URL xem trước hợp lệ</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(DashBoard);
