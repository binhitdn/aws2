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
      body: formData, // Không đặt headers 'Content-Type'
    });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid JSON response');
    }

    const data = await res.json();
    if (res.ok) {
      alert('File uploaded successfully');
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
