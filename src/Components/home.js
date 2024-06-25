import React, { useState } from 'react';
import {
  Button, CircularProgress, Typography, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Select, MenuItem, InputLabel, FormControl, TextField, Tabs, Tab, Box
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Header from '../Header/header'

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [originalData, setOriginalData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [planData, setPlanData] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [algorithm, setAlgorithm] = useState('');
  const [dataFetched, setDataFetched] = useState(false);
  const [tabValue, setTabValue] = useState(0);


    const handleFileChange = (event) => {
      const file = event.target.files[0];
      setSelectedFile(file);
      setMessage(null);
    
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Specify the sheet name you want to read
        const targetSheetName = 'pending';
    
        // Check if the sheet exists
        if (workbook.SheetNames.includes(targetSheetName)) {
          // Read the specific sheet
          const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[targetSheetName], { header: 1 });
    
          // Extract headers
          const headers = worksheet[0];
    
          // Process rows and add a new column "Option" with default value
          const rows = worksheet.slice(1).map((row) => {
            const rowData = {};
            headers.forEach((header, index) => {
              rowData[header] = row[index];
            });
            rowData['Option'] = 'Optional'; // Add default value for the new column
            return rowData;
          });
    
          // Set the processed data to state
          setOriginalData(rows);
          setDataFetched(false); // Reset data fetched status
        } else {
          // If the sheet does not exist, display a message
          setMessage(`Sheet "${targetSheetName}" not found in the Excel file.`);
        }
      };
      reader.readAsArrayBuffer(file);
    };

  const handleDropdownChange = (e, rowIndex) => {
    const updatedData = [...originalData];
    updatedData[rowIndex]['Option'] = e.target.value;
    setOriginalData(updatedData);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(originalData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const formData = new FormData();
    formData.append('file', new Blob([wbout], { type: 'application/octet-stream' }), selectedFile.name);

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
      setDataFetched(true); // Mark data as fetched
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching data. Please try again.' });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e, rowIndex, columnName) => {
    const updatedPlanData = [...planData];
    const newValue = e.target.value ? parseFloat(e.target.value) : 0;

    updatedPlanData[rowIndex][columnName] = newValue;

    // Update Total width column
    updatedPlanData[rowIndex]['Total width'] = Object.keys(updatedPlanData[rowIndex])
      .filter(key => key >= 0 && key <= 11)
      .reduce((sum, key) => sum + (parseFloat(updatedPlanData[rowIndex][key]) || 0), 0);

    setPlanData(updatedPlanData);
  };

  const downloadExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const renderEditableCell = (rowIndex, columnName, value) => (
    <TextField
      value={value}
      onChange={(e) => handleInputChange(e, rowIndex, columnName)}
      type="text"
      variant="outlined"
      size="small"
      inputProps={{ style: { width: '40px' } }} // Adjust the width as needed
    />
  );

  const renderTable = (data, title, isEditable) => {
    if (!data || data.length === 0) {
      return null;
    }

    return (
      <div>
        <Typography variant="h6" style={{ marginTop: '20px' }}>{title}</Typography>
        <TableContainer component={Paper} style={{ marginTop: '10px', maxHeight: '500px', overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {Object.keys(data[0]).map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Object.keys(row).map((column, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {isEditable && column >= 0 && column <= 11
                        ? renderEditableCell(rowIndex, column, row[column])
                        : column === 'Option' ? (
                          <Select
                            value={row[column]}
                            onChange={(e) => handleDropdownChange(e, rowIndex)}
                            variant="outlined"
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="MustMake">Must Make</MenuItem>
                            <MenuItem value="Optional">Optional</MenuItem>
                          </Select>
                        ) : (
                          row[column]
                        )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {title === "Original File" && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUpload}
            style={{ marginTop: '10px' }}
          >
            Upload Modified File
          </Button>
        )}
        {title !== "Original File" && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => downloadExcel(data, title.replace(' ', '_'))}
            style={{ marginTop: '10px' }}
          >
            Download {title} as Excel
          </Button>
        )}
      </div>
    );
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Header />
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
        {selectedFile && (
          <Typography variant="body1" style={{ display: 'inline', marginLeft: '10px' }}>
            {selectedFile.name}
          </Typography>
        )}
        {!dataFetched && selectedFile && renderTable(originalData, "Original File", false)}
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
        {dataFetched && (
          <Box sx={{ width: '100%', marginTop: '20px' }}>
            <Tabs value={tabValue} onChange={handleChangeTab} aria-label="plan and customer data tabs">
              <Tab label="Plan Data" />
              <Tab label="Customer Data" />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              {renderTable(planData, "Plan Data", true)}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderTable(customerData, "Customer Data", false)}
            </TabPanel>
          </Box>
        )}
      </div>
    </>
  );
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default Home;
