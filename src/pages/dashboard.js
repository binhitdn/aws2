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
      // Bước 1: Gọi API backend để lấy signed URL (downloadUrl)
      const res = await axios.get(`/api/documents/download/${documentId}`);
      let { downloadUrl } = res.data;
      if (!downloadUrl) {
        throw new Error('Không nhận được URL tải xuống');
      }
      console.log('🔗 Download URL (raw):', downloadUrl);

      // Sửa lỗi URL bị lặp: nếu downloadUrl chứa "https%3A", decode và trích xuất file key
      const s3Prefix = "https://casestudy-001.s3.ap-southeast-1.amazonaws.com/";
      if (downloadUrl.includes("https%3A")) {
        const decoded = decodeURIComponent(downloadUrl);
        const index = decoded.indexOf("uploads/");
        if (index !== -1) {
          downloadUrl = s3Prefix + decoded.substring(index);
        } else {
          downloadUrl = decoded;
        }
      }
      console.log('🔗 Download URL (fixed):', downloadUrl);

      // Bước 2: Gọi axios để tải file dạng blob
      const fileResponse = await axios.get(downloadUrl, { responseType: 'blob' });
      if (!fileResponse.data) {
        throw new Error('Không tải được file');
      }

      // Bước 3: Tạo URL tạm và tải file
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

  // Hàm bắt đầu chỉnh sửa document
  const startEditing = (doc) => {
    setEditingDocumentId(doc.id);
    setEditTitle(doc.title);
    setEditDescription(doc.description);
  };

  // Hàm hủy chỉnh sửa
  const cancelEditing = () => {
    setEditingDocumentId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // Hàm cập nhật document
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

  // Hàm xem trước tài liệu (Preview)
  const handlePreview = async (doc) => {
    try {
      const res = await fetch(`/api/documents/download/${doc.id}`);
      if (!res.ok) throw new Error('Lỗi khi lấy link preview');
      const data = await res.json();
      console.log("Response từ API:", data); // Debug log

      if (!data.downloadUrl || typeof data.downloadUrl !== 'string') {
        throw new Error('Không nhận được URL preview hợp lệ');
      }
      // Sửa URL nếu cần
      let previewUrlFixed = data.downloadUrl;
      if (previewUrlFixed.includes("https%3A")) {
        const decoded = decodeURIComponent(previewUrlFixed);
        const index = decoded.indexOf("uploads/");
        if (index !== -1) {
          previewUrlFixed = "https://casestudy-001.s3.ap-southeast-1.amazonaws.com/" + decoded.substring(index);
        } else {
          previewUrlFixed = decoded;
        }
      }
      setDocPreviewUrl(previewUrlFixed);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Lỗi preview:', error);
      alert('Không thể xem trước tài liệu');
    }
  };

  // Cải tiến chức năng đăng xuất
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
    localStorage.removeItem('token');
    router.replace('/login');
  };

  if (!user) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          {previewUrl && (
            <div className="mb-4">
              <p className="font-medium">Preview:</p>
              <img src={previewUrl} alt="Preview" className="max-w-xs rounded shadow" />
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
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
                {editingDocumentId === doc.id ? (
                  <div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mb-2"
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mb-2"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(doc.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold">{doc.title}</h3>
                    <p className="mt-2">{doc.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => startEditing(doc)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Chưa có tài liệu nào được upload.</p>
        )}
      </div>

      {/* Modal xem trước tài liệu */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-red-500 font-bold text-xl"
            >
              &times;
            </button>
            <div className="mt-4">
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
                          {/* Icon file (SVG) */}
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
}

export default withAuth(DashBoard);
