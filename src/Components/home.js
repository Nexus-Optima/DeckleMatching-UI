import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Tabs,
  Tab,
  Box,
  Drawer,
  List,
  ListItem,
  Container,
  Grid,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import axios from "axios";
import * as XLSX from "xlsx";
import Header from "../Header/header";
import theme from "../Themes/themes";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import OutputIcon from "@mui/icons-material/Output";
import logo from "../Images/abc_image.png";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import "../Styles/Home.css";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [originalData, setOriginalData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [planData, setPlanData] = useState([]);
  const [metricData, setMetricData] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [algorithm, setAlgorithm] = useState("");
  const [productName, setProductName] = useState("");
  const [productTypes, setProductTypes] = useState([]);
  const [productConfig, setProductConfig] = useState("");
  const [productConfigInput, setProductConfigInput] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedOption, setSelectedOption] = useState("file upload");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [mainDomain, setMainDomain] = useState(
    process.env.REACT_APP_MAIN_DOMAIN
  );
  const [dragOver, setDragOver] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    setSelectedFile(file);
    handleFileChange({ target: { files: [file] } });
  };

  useEffect(() => {
    if (!document.referrer.startsWith(mainDomain)) {
      setUnauthorized(true);
    }
  }, [mainDomain]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const targetSheetName = "PENDING";
      // Normalize target sheet name
      const normalizedTargetSheetName = targetSheetName.trim().toLowerCase();

      // Normalize workbook sheet names
      const normalizedSheetNames = workbook.SheetNames.map(name => name.trim().toLowerCase());

      // Check if the normalized target sheet name exists
      const sheetIndex = normalizedSheetNames.indexOf(normalizedTargetSheetName);
      if (sheetIndex !== -1) {
        const actualSheetName = workbook.SheetNames[sheetIndex];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[actualSheetName], { header: 1 });
        const headers = worksheet[0];
        const rows = worksheet.slice(1).map((row) => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });
          rowData["Option"] = "Optional";
          return rowData;
        });
        setOriginalData(rows);
        setDataFetched(false);
      } else {
        setMessage(`Sheet "${targetSheetName}" not found in the Excel file.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleToggleChange = (e, rowIndex) => {
    const updatedData = [...originalData];
    updatedData[rowIndex]["Option"] = e.target.checked
      ? "MustMake"
      : "Optional";
    setOriginalData(updatedData);
  };

  const handleSelectAllChange = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    const updatedData = originalData.map((row) => ({
      ...row,
      Option: checked ? "MustMake" : "Optional",
    }));
    setOriginalData(updatedData);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setLoading(true);

    try {
      if (document.referrer.startsWith(mainDomain)) {
        setMessage({ type: "info", text: "Getting Best Results..." });
        const response = await axios.post(
          `${process.env.REACT_APP_API_DOMAIN}/api/upload`,
          { data: originalData },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const types = response.data.data.product_type;
        setProductTypes(types);
        const productConfigInput = response.data.data.product_config;
        setProductConfigInput(productConfigInput);
        setMessage({ type: "success", text: "File uploaded successfully!" });
        setSelectedOption("results");
      } else {
        setUnauthorized(true);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error uploading file. Please try again.",
      });
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!algorithm || !productName || !productConfig) {
      setMessage({
        type: "error",
        text: "Please select an algorithm, product name, and product config",
      });
      return;
    }

    setFetching(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_DOMAIN}/api/fetch_plan_data`,
        {
          params: {
            algorithm,
            product_name: productName,
            product_config: productConfig,
            client_name: "CPFL",
          },
        }
      );

      setCustomerData(response.data.customer);
      setPlanData(response.data.plan);
      setMetricData(response.data.metric);
      setMessage(null);
      setDataFetched(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error fetching data. Please try again.",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e, rowIndex, columnName) => {
    const updatedPlanData = [...planData];
    const newValue = e.target.value ? parseFloat(e.target.value) : 0;
    updatedPlanData[rowIndex][columnName] = newValue;
    updatedPlanData[rowIndex]["Total width"] = Object.keys(
      updatedPlanData[rowIndex]
    )
      .filter((key) => key >= 0 && key <= 11)
      .reduce(
        (sum, key) => sum + (parseFloat(updatedPlanData[rowIndex][key]) || 0),
        0
      );
    setPlanData(updatedPlanData);
  };

  const downloadExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const renderEditableCell = (rowIndex, columnName, value) => (
    <TextField
      value={value}
      onChange={(e) => handleInputChange(e, rowIndex, columnName)}
      type="text"
      variant="outlined"
      size="small"
      inputProps={{
        style: {
          width: value / 16,
          fontSize: "14px", // Adjust the font size here
          padding: 5, // Remove padding
        },
      }}
    />
  );

  const renderTable = (data, title, isEditable) => {
    if (!data || data.length === 0) return null;
    let columns = Object.keys(data[0]);
    if (title === selectedFile.name) {
      columns = ["Option", ...columns.filter((col) => col !== "Option")];
    }

    return (
      <ThemeProvider theme={theme}>
        <div>
          <TableContainer
            component={Paper}
            style={{
              marginTop: "1%",
              marginBottom: "1%",
              border: "1px solid #ccc",
              height: "60vh",
              width: "100%",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      style={{
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        background: "black",
                        color: "white",
                        textAlign: column === "Option" ? "center" : "left",
                      }}
                    >
                      {column === "Option" && title !== "Customer Data" ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body2"
                            style={{
                              color: "white",
                              marginBottom: "4px",
                              fontWeight: "bold",
                            }}
                          >
                            Option
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectAll}
                                  onChange={handleSelectAllChange}
                                  name="selectAll"
                                  sx={{
                                    "& .MuiSvgIcon-root": {
                                      fontSize: 16,
                                      color: "white",
                                    },
                                  }}
                                />
                              }
                              label="Select All"
                              sx={{ marginRight: 1.3 }}
                            />
                          </FormGroup>
                        </div>
                      ) : (
                        column
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        style={{
                          border: "1px solid #ccc",
                          padding: 5, // Remove padding from TableCell
                        }}
                      >
                        {isEditable && column >= 0 && column <= 11 ? (
                          renderEditableCell(rowIndex, column, row[column])
                        ) : column === "Option" && title !== "Customer Data" ? (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={row[column] === "MustMake"}
                                onChange={(e) =>
                                  handleToggleChange(e, rowIndex)
                                }
                                name={`toggle-${rowIndex}`}
                                className="custom-switch"
                              />
                            }
                            label={
                              row[column] === "MustMake"
                                ? "Must Make"
                                : "Optional"
                            }
                            labelPlacement="start"
                          />
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
          {title === selectedFile.name && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpload}
                style={{ marginTop: "10px", marginRight: "10px" }}
              >
                Upload Modified File
              </Button>
              {message && (
                <Alert severity={message.type} style={{ marginTop: "10px" }}>
                  {message.text}
                </Alert>
              )}
              <Button
                variant="contained"
                color="secondary"
                onClick={resetHandler}
                style={{ marginTop: "10px" }}
              >
                Reset
              </Button>
            </div>
          )}
          {title !== selectedFile.name && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => downloadExcel(data, title.replace(" ", "_"))}
              style={{ marginTop: "10px" }}
            >
              Download {title} as Excel
            </Button>
          )}
        </div>
      </ThemeProvider>
    );
  };

  const renderPlanTable = (data, title, isEditable) => {
    if (!data || data.length === 0) return null;
    const additionalColumns = ["Total width", "Trim", "Sets"]; // Add any additional specific columns here
    const numericalColumns = Object.keys(data[0]).filter((key) =>
      /^\d+$/.test(key)
    ); // Selects columns with only numbers
    const columnsToShow = [...additionalColumns, ...numericalColumns];
    return (
      <ThemeProvider theme={theme}>
        <div>
          <Typography variant="h6" style={{}}>
            {title}
          </Typography>
          <TableContainer
            component={Paper}
            style={{
              marginTop: "1%",
              marginBottom: "1%",
              border: "1px solid #ccc",
              height: "55vh",
              width: "100%",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columnsToShow.map((column) => (
                    <TableCell
                      key={column}
                      style={{
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        background: "black",
                        color: "white",
                      }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columnsToShow.map((column, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        style={{
                          border: "1px solid #ccc",
                          padding: 5, // Remove padding from TableCell
                        }}
                      >
                        {isEditable && column >= 0 && column <= 11 ? (
                          renderEditableCell(rowIndex, column, row[column])
                        ) : column === "Option" ? (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={row[column] === "MustMake"}
                                onChange={(e) =>
                                  handleToggleChange(e, rowIndex)
                                }
                                name={`toggle-${rowIndex}`}
                                className="custom-switch"
                              />
                            }
                            label={
                              row[column] === "MustMake"
                                ? "Must Make"
                                : "Optional"
                            }
                            labelPlacement="start"
                          />
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
          {title === selectedFile.name && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpload}
              style={{ marginTop: "10px" }}
            >
              Upload Modified File
            </Button>
          )}
          {title !== selectedFile.name && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => downloadExcel(data, title.replace(" ", "_"))}
              style={{ marginTop: "10px" }}
            >
              Download {title} as Excel
            </Button>
          )}
        </div>
      </ThemeProvider>
    );
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const resetHandler = () => {
    setSelectedFile(null);
    setMessage(null);
    setOriginalData([]);
    setDataFetched(false);
  };

  const renderUploadSection = () => (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {!selectedFile && (
        <input
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          id="contained-button-file"
          type="file"
          onChange={handleFileChange}
        />
      )}
      {!selectedFile && (
        <label
          htmlFor="contained-button-file"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "20%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed black",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: "#f9f9f9",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Typography variant="h6" style={{ textAlign: "center" }}>
            Drag and drop your file here or click to select
          </Typography>
        </label>
      )}
      {selectedFile && (
        <Typography
          variant="body1"
          style={{
            marginTop: "10px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "3vh",
          }}
        >
          {selectedFile.name}
        </Typography>
      )}
      {originalData.length > 0 &&
        renderTable(originalData, selectedFile.name, false)}
    </div>
  );

  const renderOutputSection = () => (
    <div>
      <Grid container spacing={2} alignItems="center" justifyContent="center">
        <Grid item xs={12} md={3}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel style={{ color: "black" }}>Algorithm</InputLabel>
            <Select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              label="Algorithm"
              sx={{
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                },
                "&.Mui-focused .MuiInputLabel-outlined": {
                  color: "black",
                },
              }}
            >
              <MenuItem value="knives">Knives</MenuItem>
              <MenuItem value="wastage">Wastage</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel style={{ color: "black" }}>Product Name</InputLabel>
            <Select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              label="Product Name"
              sx={{
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                },
                "&.Mui-focused .MuiInputLabel-outlined": {
                  color: "black",
                },
              }}
            >
              {productTypes.map((type, index) => (
                <MenuItem key={index} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel style={{ color: "black" }}>Product Config</InputLabel>
            <Select
              value={productConfig}
              onChange={(e) => setProductConfig(e.target.value)}
              label="Product Config"
              sx={{
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                },
                "&.Mui-focused .MuiInputLabel-outlined": {
                  color: "black",
                },
              }}
            >
              {productConfigInput.map((config, index) => (
                <MenuItem key={index} value={config}>
                  {config}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid
          item
          xs={12}
          md={3}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={fetchData}
            disabled={fetching}
            style={{ width: "100%" }}
            startIcon={fetching ? <CircularProgress size={24} /> : null}
          >
            {fetching ? "Fetching..." : "Fetch Data"}
          </Button>
        </Grid>
      </Grid>
      {dataFetched && (
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleChangeTab}
            aria-label="plan and customer data tabs"
            sx={{
              "& .MuiTab-root": {
                color: "black",
                "&.Mui-selected": {
                  color: "black",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "black",
              },
            }}
          >
            <Tab label="Metric Data" />
            <Tab label="Plan Data" />
            <Tab label="Customer Data" />
          </Tabs>
          <TabPanel value={tabValue} index={0}>
            {renderTable(metricData, "Metric Data", false)}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderPlanTable(planData, "Plan Data", true)}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderTable(customerData, "Customer Data", false)}
          </TabPanel>
        </Box>
      )}
    </div>
  );

  const dragOverStyles = `
    .drag-over {
      border: 2px solid #000;
      background-color: #e0e0e0;
    }
  `;
  return (
    <ThemeProvider theme={theme}>
      <style>{dragOverStyles}</style>
      {unauthorized ? (
        <Container
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            textAlign: "center",
            paddingBottom: "35%",
          }}
        >
          <Typography variant="h5" color="error">
            Unauthorized - Access denied.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            style={{
              marginTop: "2%",
              backgroundColor: "black",
              color: "white",
            }}
            onClick={() => (window.location.href = mainDomain)}
          >
            Go back to dashboard
          </Button>
        </Container>
      ) : (
        <>
          <Header />
          <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
            <Drawer
              variant="permanent"
              open
              sx={{
                "& .MuiDrawer-paper": {
                  overflowX: "hidden",
                },
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{
                  padding: "0 1%",
                  width: "150px",
                  height: "80px",
                }}
              />
              <Box style={{ paddingLeft: "2vw", paddingBottom: "8vh" }}>
                <List>
                  <ListItem
                    button
                    onClick={() => setSelectedOption("file upload")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      padding: "1vw",
                      width: "75%",
                      textTransform: "none",
                      fontSize: "1vw",
                      color: "black",
                      backgroundColor: "transparent",
                      border:
                        selectedOption === "file upload"
                          ? "0.2vw solid black"
                          : "none",
                    }}
                  >
                    <FileUploadIcon
                      sx={{
                        fontSize: "3vw",
                      }}
                    ></FileUploadIcon>
                    <Typography
                      style={{ whiteSpace: "nowrap", fontWeight: "bold" }}
                    >
                      File Upload
                    </Typography>
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => setSelectedOption("results")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      padding: "1vw",
                      width: "75%",
                      textTransform: "none",
                      fontSize: "1vw",
                      color: "black",
                      backgroundColor: "transparent",
                      border:
                        selectedOption === "results"
                          ? "0.2vw solid black"
                          : "none",
                      marginTop: 15,
                    }}
                  >
                    <OutputIcon
                      sx={{
                        fontSize: "3vw",
                      }}
                    ></OutputIcon>
                    <Typography style={{ fontWeight: "bold" }}>
                      Results
                    </Typography>
                  </ListItem>
                </List>
              </Box>
            </Drawer>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100%",
                padding: "0",
                boxSizing: "border-box",
                paddingLeft: "calc(10% + 16px)",
              }}
            >
              <Container
                style={{
                  padding: "20px",
                  position: "relative",
                  height: "calc(100vh - 64px)",
                  maxWidth: "90%",
                  width: "100%",
                  textAlign: "center",
                  transform: "translateY(-5%)",
                  boxSizing: "border-box",
                }}
              >
                {selectedOption === "file upload" && renderUploadSection()}
                {selectedOption === "results" && renderOutputSection()}
              </Container>
            </div>
          </div>
        </>
      )}
    </ThemeProvider>
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
          <Typography fontWeight="bold">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default Home;
