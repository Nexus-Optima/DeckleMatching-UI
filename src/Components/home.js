import React, { useState } from 'react';
import { Button, CircularProgress, Typography, Alert } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error uploading file. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        id="contained-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="contained-button-file">
        <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
          Select File
        </Button>
      </label>
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        startIcon={uploading ? <CircularProgress size={24} /> : <CloudUploadIcon />}
        style={{ marginLeft: '10px' }}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
      {message && (
        <div style={{ marginTop: '20px' }}>
          <Alert severity={message.type}>{message.text}</Alert>
        </div>
      )}
    </div>
  );
};

export default Home;
