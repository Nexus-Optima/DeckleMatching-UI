import React, { useState } from 'react';
import { Button, CircularProgress, Typography, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [customerData, setCustomerData] = useState([]);
  const [planData, setPlanData] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [algorithm, setAlgorithm] = useState('');

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
      await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/upload`, formData, {
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

  const fetchData = async () => {
    if (!algorithm) {
      setMessage({ type: 'error', text: 'Please select an algorithm' });
      return;
    }

    setFetching(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/fetch_plan_data`, {
        params: { algorithm }
      });

      setCustomerData(response.data.customer);
      setPlanData(response.data.plan);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching data. Please try again.' });
    } finally {
      setFetching(false);
    }
  };

  const renderTable = (data, title) => {
    if (!data || data.length === 0) {
      return null;
    }

    return (
      <div>
        <Typography variant="h6" style={{ marginTop: '20px' }}>{title}</Typography>
        <TableContainer component={Paper} style={{ marginTop: '10px' }}>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(data[0]).map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((cellValue, cellIndex) => (
                    <TableCell key={cellIndex}>{cellValue}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
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
      <div style={{ marginTop: '20px' }}>
        <FormControl variant="outlined" style={{ marginRight: '10px', minWidth: 200 }}>
          <InputLabel>Algorithm</InputLabel>
          <Select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            label="Algorithm"
          >
            <MenuItem value="knives">Knives</MenuItem>
            <MenuItem value="wastage">Wastage</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchData}
          disabled={fetching}
          startIcon={fetching ? <CircularProgress size={24} /> : null}
        >
          {fetching ? 'Fetching...' : 'Fetch Data'}
        </Button>
      </div>
      {renderTable(planData, "Plan Data")}
      {renderTable(customerData, "Customer Data")}
    </div>
  );
};

export default Home;
