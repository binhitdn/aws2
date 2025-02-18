import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import withAuth from '@/hoc/withAuth';
import axios from '../lib/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from 'react-spinners';

const DashBoard = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(''); 
  const [docPreviewUrl, setDocPreviewUrl] = useState(''); 
  const [isPreviewLoading, setIsPreviewLoading] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false); 
  const [officeEditUrl, setOfficeEditUrl] = useState(''); 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      console.error('Error fetching user info:', err);
      toast.error('Error fetching user info');
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      } else {
        console.warn('Returned data is not an array:', data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
      toast.error('Error fetching documents');
    }
  };

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
      toast.error('Please select a file to upload');
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
        toast.success('File uploaded successfully');
        setDocuments((prev) => [...prev, data.document]);
        setTitle('');
        setDescription('');
        setFile(null);
        setPreviewUrl('');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Document deleted successfully');
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (documentId) => {
    try {

      const res = await axios.get(`/api/documents/download/${documentId}`);
      let { downloadUrl } = res.data;
      if (!downloadUrl) {
        throw new Error('Did not receive a download URL');
      }
      const s3Prefix = "https://casestudy-001.s3.ap-southeast-1.amazonaws.com/";
      if (downloadUrl.includes("https%3A")) {
        const decoded = decodeURIComponent(downloadUrl);
        const index = decoded.indexOf("uploads/");
        downloadUrl = index !== -1 ? s3Prefix + decoded.substring(index) : decoded;
      }

      const fileResponse = await axios.get(downloadUrl, { responseType: 'blob' });
      if (!fileResponse.data) throw new Error('Unable to download file');
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
      console.error('Download error:', error);
      toast.error('Download failed');
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
        toast.success('Document updated successfully');
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === id ? { ...doc, title: editTitle, description: editDescription } : doc
          )
        );
        cancelEditing();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Update failed');
    }
  };

  const handlePreview = async (doc) => {
    try {
      const res = await fetch(`/api/documents/download/${doc.id}`);
      if (!res.ok) throw new Error('Error retrieving preview URL');
      const data = await res.json();
      if (!data.downloadUrl || typeof data.downloadUrl !== 'string') {
        throw new Error('Invalid preview URL');
      }
      let previewUrlFixed = data.downloadUrl;
      if (previewUrlFixed.includes("https%3A")) {
        const decoded = decodeURIComponent(previewUrlFixed);
        const index = decoded.indexOf("uploads/");
        previewUrlFixed =
          index !== -1
            ? "https://casestudy-001.s3.ap-southeast-1.amazonaws.com/" + decoded.substring(index)
            : decoded;
      }

      const ext = previewUrlFixed.split('.').pop().split(/\#|\?/)[0].toLowerCase();

        setDocPreviewUrl(previewUrlFixed);

      setIsModalOpen(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Unable to preview document');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout error');
    }
    localStorage.removeItem('token');
    router.replace('/login');
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      {}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600">Drive</h1>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search documents..."
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Profile</h2>
            {user ? (
              <div>
                <p>
                  <span className="font-medium">Name:</span> {user.name}
                </p>
                <p className="mt-2">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
              />
              <input
                type="text"
                placeholder="Description"
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

        {}
        <section>
          <h2 className="text-2xl font-semibold mb-4">My Documents</h2>
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
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => startEditing(doc)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Edit Info
                    </button>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents uploaded yet.</p>
          )}
        </section>
      </main>

      {}
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
              {isPreviewLoading ? (
                <div className="flex justify-center items-center h-96">
                  <ClipLoader color="#123abc" size={50} />
                </div>
              ) : docPreviewUrl ? (
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
                          Unsupported file preview
                        </p>
                        <a
                          href={docPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                          Download File
                        </a>
                      </div>
                    );
                  }
                })()
              ) : (
                <p className="text-center text-gray-600">No valid preview URL available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {isOfficeModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white rounded-lg shadow-lg relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setIsOfficeModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-3xl"
            >
              &times;
            </button>
            <div className="p-6">
              <iframe
                src={officeEditUrl}
                width="100%"
                height="600px"
                className="rounded"
                title="Office Editor"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(DashBoard);