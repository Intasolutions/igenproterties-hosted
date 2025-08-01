import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Card, CardContent, Typography, TablePagination, IconButton, Tooltip,Slide,Snackbar, Alert,Box,Grid, 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />; 
});

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [splitDialog, setSplitDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [banks, setBanks] = useState([]);
  const [costCentres, setCostCentres] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [entities, setEntities] = useState([]);
  const [classifiedDetails, setClassifiedDetails] = useState([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
const [searchCompany, setSearchCompany] = useState(''); const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });


  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [form, setForm] = useState({
    company: '', bank_account: '', cost_centre: '', transaction_type: '',
    direction: 'CREDIT', amount: '', date: '', notes: ''
  });

  const [splitRows, setSplitRows] = useState([
    { cost_centre: '', entity: '', transaction_type: '', asset: '', contract: '', amount: '', value_date: '', remarks: '' }
  ]);

useEffect(() => {
  fetchData();
}, []);

  const fetchData = async () => {
    try {
      const [trans, classifiedRes, comps, bks, ccs, tts, ents] = await Promise.all([
        API.get('transactions/'),
        API.get('classified-transactions'),
        API.get('companies/'),
        API.get('banks/'),
        API.get('cost-centres/'),
        API.get('transaction-types/'),
        API.get('entities/')
      ]);

      const transactions = Array.isArray(trans.data) ? trans.data : [];
      const classified = Array.isArray(classifiedRes.data) ? classifiedRes.data : [];

      setTransactions([...transactions, ...classified]); // ✅ Append
      setClassifiedDetails(classified); // optional: store separately too

      setCompanies(comps.data);
      setBanks(bks.data);
      setCostCentres(ccs.data);
      setTransactionTypes(tts.data);
      setEntities(ents.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch data', severity: 'error' });
    }
  };


  const handleBulkUpload = async () => {
    if (!file) {
      setSnackbar({ open: true, message: 'Please select a file', severity: 'warning' });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      await API.post('bulk-upload/', formData, {

        headers: { 'Content-Type': 'multipart/form-data' }
      });
       setSnackbar({ open: true, message: 'Bulkupload successfully completed', severity: 'sucCess' });
      setBulkDialogOpen(false);
      setFile(null);
      fetchData();
  } catch (err) {
  const data = err.response?.data;
  console.error("Upload Error:", data);

  if (data?.errors?.length > 0) {
    data.errors.forEach((errRow) => {
      console.error(`Row ${errRow.row} Error:`, errRow.errors);
    });
  }

  setSnackbar({
    open: true,
    message: data?.message || 'Bulk upload failed',
    severity: 'error'
  });
}

  };

  const handleFileChange = (e) => setFile(e.target.files[0]);



  const handleAddTransaction = async () => {
    const { company, bank_account, cost_centre, transaction_type, direction, amount, date } = form;
    if (!company || !bank_account || !cost_centre || !transaction_type || !amount || !date) {
      setSnackbar({ open: true, message: 'All fields are required', severity: 'warning' });
      return;
    }
    try {
      const payload = {
        ...form,
        company: parseInt(company),
        bank_account: parseInt(bank_account),
        cost_centre: parseInt(cost_centre),
        transaction_type: parseInt(transaction_type),
        amount: parseFloat(amount)
      };
      await API.post('transactions/', payload);
  setSnackbar({ open: true, message: 'Transaction Added successfully', severity: 'success' });
      fetchData();
      setOpen(false);
      setForm({ company: '', bank_account: '', cost_centre: '', transaction_type: '', direction: 'CREDIT', amount: '', date: '', notes: '' });
    } catch (err) {
       setSnackbar({ open: true, message: 'Failed to add transaction', severity: 'error' });
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await API.delete(`transactions/${id}/`);
     setSnackbar({ open: true, message: 'Transaction Deleted ', severity: 'error' });
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleAddSplitRow = () => {
    setSplitRows([...splitRows, {
      cost_centre: '', entity: '', transaction_type: '', asset: '', contract: '',
      amount: '', value_date: '', remarks: ''
    }]);
  };

  const handleSplitChange = (index, field, value) => {
    const updated = [...splitRows];
    updated[index][field] = value;
    setSplitRows(updated);
  };

  const handleSubmitSplit = async () => {
    if (!selectedTransaction) {
      setSnackbar({ open: true, message: 'No Transaction Selected', severity: 'error' });
      return;
    }

    const totalSplitAmount = splitRows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
    if (totalSplitAmount !== parseFloat(selectedTransaction.amount)) {
      setSnackbar({open:true ,  message:`Split amount (${totalSplitAmount}) must equal the transaction amount (${selectedTransaction.amount})`, severity:'warning' });
      return;
    }

    for (const row of splitRows) {
      if (!row.cost_centre || !row.entity || !row.transaction_type || !row.amount || !row.value_date) {
        setSnackbar({open:true,message:'Please fill in all required fields for each row.', severity:'warning'});
        return;
      }
    }

    try {
      const payload = splitRows.map(row => {
        const entry = {
          transaction: selectedTransaction.id,
          cost_centre: row.cost_centre,
          entity: row.entity,
          transaction_type: row.transaction_type,
          amount: parseFloat(row.amount),
          value_date: row.value_date,
          remarks: row.remarks || '',
        };
        if (row.asset) entry.asset = row.asset;
        if (row.contract) entry.contract = row.contract;
        return entry;
      });

      await API.post('classified-transactions/', payload);

      setSnackbar({open:true, message:'Split saved' , severity:'success'
      });
      setSplitDialog(false);
      setSelectedTransaction(null);
      setSplitRows([{ cost_centre: '', entity: '', transaction_type: '', asset: '', contract: '', amount: '', value_date: '', remarks: '' }]);
      fetchData();
    } catch (err) {
      console.error(err);
      setSnackbar({open:true,message:'Failed to save split',severity:'error'});
    }
  };

const handleOpenSplitDialog = async (txn) => {
  try {
    // Check from backend if the transaction already has split entries
    const res = await API.get(`/classified-transactions/?transaction=${txn.id}`);
    const alreadySplit = Array.isArray(res.data) && res.data.length > 0;

    if (alreadySplit) {
      setSnackbar({
        open: true,
        message: 'This transaction is already split.',
        severity: 'info',
      });
      return;
    }

    // If not split yet, open the dialog
    setSelectedTransaction(txn);
    setSplitRows([
      {
        cost_centre: '',
        entity: '',
        transaction_type: '',
        asset: '',
        contract: '',
        amount: '',
        value_date: '',
        remarks: '',
      },
    ]);
    setSplitDialog(true);
  } catch (error) {
    console.error('Failed to check split status:', error);
    setSnackbar({
      open: true,
      message: 'Failed to check split status. Try again.',
      severity: 'error',
    });
  }
};


  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  console.log('paginated:',transactions)
const filteredTransactions = transactions
// .filter(t =>
//   t.company_name?.toLowerCase().includes(searchCompany.toLowerCase())
// );

const paginatedData = rowsPerPage > 0
  ? filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  : filteredTransactions;

const handleExportToCSV = () => {
  const headers = [
    "Company", "Bank", "Cost Centre", "Transaction Type", "Direction", "Amount", "Date", "Notes"
  ];

  

  const rows = transactions.map((t) => [
    t.company_name || '',
    t.bank_name || '',
    t.cost_centre_name || '',
    t.transaction_type_name || '',
    t.direction,
    t.amount,
    t.date,
    t.notes || ''
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows]
      .map((row) => row.map((item) => `"${item}"`).join(","))
      .join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const handleRemoveSplitRow = (index) => {
  const updatedRows = [...splitRows];
  updatedRows.splice(index, 1);
  setSplitRows(updatedRows);
};



  return (
    <div className="p-[35px]">
       <Typography variant="h5" fontWeight="bold">Transaction Management</Typography>
<div className="flex justify-between items-center mb-4 mt-6">
  <div className="flex-1 max-w-sm">
  <TextField
    label="Search by Company"
    variant="outlined"
    size="small"
    fullWidth
    value={searchCompany}
    onChange={(e) => setSearchCompany(e.target.value)}
    placeholder="Type company name..."
   
    InputProps={{
      startAdornment: (
        <span className="material-icons text-gray-500 mr-2">search</span>
      ),
      sx: {
        borderRadius: 2,
        backgroundColor: '#fafafa',
      }
    }}
  />
  </div>
 

        <div className="flex gap-3">
          <Button
  variant="outlined"
  color="success"
  onClick={handleExportToCSV}
  startIcon={<DownloadIcon />}
  sx={{
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 500,
    px: 2,
    bgcolor: '#e8f5e9',
    '&:hover': {
      bgcolor: '#c8e6c9',
    },
  }}
>
  Export CSV
</Button>

         <Button
  variant="outlined"
  color="info"
  onClick={() => setBulkDialogOpen(true)}
  startIcon={<UploadFileIcon />}
  sx={{
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 500,
    px: 2,
    bgcolor: '#e3f2fd',
    '&:hover': {
      bgcolor: '#bbdefb',
    },
  }}
>
  Bulk Upload
</Button>
          <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Transaction</Button>
        </div>
        </div>
     


<Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
    Upload file
    <IconButton
      onClick={() => setBulkDialogOpen(false)}
      sx={{ position: 'absolute', top: 12, right: 12 }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent sx={{ px: 3, py: 2 }}>
    <Typography variant="body2" mb={2}>
      Add your files or documents here
    </Typography>

    <Box
      component="label"
      htmlFor="file-upload"
      sx={{
        border: '2px dashed #d0a9f5',
        borderRadius: 2,
        backgroundColor: '#faf7ff',
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: '0.2s',
        '&:hover': {
          backgroundColor: '#f3eaff',
        }
      }}
    >
      <input
        id="file-upload"
        type="file"
        hidden
        accept=".csv,.docx,.png,.webp,.txt,.zip"
        onChange={handleFileChange}
      />
      <UploadFileIcon sx={{ fontSize: 50, color: '#a24dff', mb: 1 }} />
      <Typography variant="body1" fontWeight={500}>
        {file ? file.name : 'Drop your files here, '}
        {!file && (
          <span style={{ color: '#a24dff', cursor: 'pointer', textDecoration: 'underline' }}>
            or click to browse
          </span>
        )}
      </Typography>
    </Box>

   <Box className="flex justify-between mt-2 text-sm text-gray-500">
      <Typography variant="caption">
        Upload format must follow our{' '}
        <a href="/sample/sample.csv" download style={{ color: '#a24dff', textDecoration: 'underline' }}>
          sample CSV
        </a>
      </Typography>
      <Typography variant="caption">
        Max size: 10MB
      </Typography>
    </Box>
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 3 }}>
    <Button
      variant="contained"
      fullWidth
      disabled={!file}
      onClick={handleBulkUpload}
      sx={{
        background: 'linear-gradient(to right, #a24dff, #c06cfc)',
        borderRadius: 3,
        textTransform: 'none',
        fontWeight: 600,
        py: 1.2,
        fontSize: 16,
        '&:hover': {
          background: 'linear-gradient(to right, #9130ff, #b950fc)',
        },
      }}
    >
      Continue
    </Button>
  </DialogActions>
</Dialog>




      {/* Add Transaction Dialog */}
     <Dialog
       open={open}
       onClose={() => setOpen(false)}
       maxWidth="sm"
       fullWidth
       TransitionComponent={Transition} 
       keepMounted 
       PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
     >
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            fullWidth
            margin="dense"
          >
            {companies?.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
            )) || <MenuItem disabled>No companies</MenuItem>}
          </TextField>
          <TextField
            select
            label="Bank Account"
            value={form.bank_account}
            onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
            fullWidth
            margin="dense"
          >
            {banks?.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>{b.account_name}</MenuItem>
            )) || <MenuItem disabled>No banks</MenuItem>}
          </TextField>
          <TextField
            select
            label="Cost Centre"
            value={form.cost_centre}
            onChange={(e) => setForm({ ...form, cost_centre: e.target.value })}
            fullWidth
            margin="dense"
          >
            {costCentres?.map((cc) => (
              <MenuItem key={cc.id || cc.cost_centre_id} value={cc.id || cc.cost_centre_id}>{cc.name}</MenuItem>
            )) || <MenuItem disabled>No cost centres</MenuItem>}
          </TextField>
          <TextField
            select
            label="Transaction Type"
            value={form.transaction_type}
            onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
            fullWidth
            margin="dense"
          >
            {transactionTypes?.map((tt) => (
              <MenuItem key={tt.id || tt.transaction_type_id} value={tt.id || tt.transaction_type_id}>{tt.name}</MenuItem>
            )) || <MenuItem disabled>No transaction types</MenuItem>}
          </TextField>
          <TextField
            select
            label="Direction"
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            fullWidth
            margin="dense"
          >
            <MenuItem value="CREDIT">CREDIT</MenuItem>
            <MenuItem value="DEBIT">DEBIT</MenuItem>
          </TextField>
          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTransaction} color="primary" variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Split Dialog */}
      <Dialog open={splitDialog} onClose={() => setSplitDialog(false)}  maxWidth="md"
       fullWidth
       TransitionComponent={Transition} 
       keepMounted 
       PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#1976d2' }}>
          Split Transaction
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please allocate the transaction amount across relevant cost centres, entities, and types.
          </Typography>

        <Box
  sx={{
    backgroundColor: '#e3f2fd',
    px: 2,
    py: 2,
    borderRadius: 2,
    mb: 3
  }}
>
  {/* Top row: Label + Date */}
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      Transaction Amount
    </Typography>
    <Typography variant="body2" sx={{  fontWeight: 600, fontSize: 20, }}>
      <CalendarTodayIcon sx={{ fontSize: 25, mr: 0.5 }} />
      {selectedTransaction?.date || '—'}
    </Typography>
  </Box>
  

  {/* Second row: Amount */}
  <Typography
    variant="h5"
    sx={{
      fontWeight: 'bold',
      textAlign: 'left',
      color: '#040404ff'
    }}
  >
    ₹ {selectedTransaction?.amount?.toLocaleString('en-IN') || '0.00'}
  </Typography>
</Box>

<AnimatePresence>
  {splitRows.map((row, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box className="mb-4 p-3">
        {/* First Row */}
        <Box className="grid grid-cols-3 gap-3 mb-3">
          <TextField select label="Cost Centre" value={row.cost_centre} onChange={(e) => handleSplitChange(index, 'cost_centre', e.target.value)} fullWidth>
            {costCentres?.map((cc) => (
              <MenuItem key={cc.id || cc.cost_centre_id} value={cc.id || cc.cost_centre_id}>{cc.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Entity" value={row.entity} onChange={(e) => handleSplitChange(index, 'entity', e.target.value)} fullWidth>
            {entities?.map((ent) => (
              <MenuItem key={ent.id} value={ent.id}>{ent.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Transaction Type" value={row.transaction_type} onChange={(e) => handleSplitChange(index, 'transaction_type', e.target.value)} fullWidth>
            {transactionTypes?.map((tt) => (
              <MenuItem key={tt.id || tt.transaction_type_id} value={tt.id || tt.transaction_type_id}>{tt.name}</MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Second Row */}
        <Box className="grid grid-cols-3 gap-3 items-center">
          <TextField label="Amount" type="number" value={row.amount} onChange={(e) => handleSplitChange(index, 'amount', e.target.value)} fullWidth />
          <TextField label="Value Date" type="date" InputLabelProps={{ shrink: true }} value={row.value_date} onChange={(e) => handleSplitChange(index, 'value_date', e.target.value)} fullWidth />
          <Box className="flex items-center gap-2">
            <TextField label="Remarks" value={row.remarks} onChange={(e) => handleSplitChange(index, 'remarks', e.target.value)} fullWidth />
            {splitRows.length > 1 && (
              <IconButton color="error" onClick={() => handleRemoveSplitRow(index)}>
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  ))}
</AnimatePresence>


          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
           <Button
  onClick={handleAddSplitRow}
  startIcon={<AddIcon />}
  variant="contained"
  sx={{
    mt: 2,
    fontWeight: 600,
    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
    color: '#fff',
    borderRadius: '8px',
    boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
    textTransform: 'none',
    '&:hover': {
      background: 'linear-gradient(90deg, #1565c0 0%, #1e88e5 100%)'
    }
  }}
>
  Add Row
</Button>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSubmitSplit} color="primary" variant="contained">Save Split</Button>
        </DialogActions>
      </Dialog>


      {/* Classified Details Dialog */}



      {/* Table */}
      <Card sx={{ boxShadow: 3, borderRadius: 3, mt: 2 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Bank</TableCell>
                  <TableCell>Cost Centre</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((t, index) => (
                  <TableRow key={t.id}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{t.company_name || 'N/A'}</TableCell>
                    <TableCell>{t.bank_name || 'N/A'}</TableCell>
                    <TableCell>{t.cost_centre_name || 'N/A'}</TableCell>
                    <TableCell>{t.transaction_type_name || 'N/A'}</TableCell>
                    <TableCell>{t.direction}</TableCell>
                    <TableCell>{t.amount}</TableCell>
                    <TableCell>{t.date || t.value_date}</TableCell>
                    <TableCell>{t.notes}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Split Transaction">
                        <IconButton color="primary" onClick={() => handleOpenSplitDialog(t)}>
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Transaction">
                        <IconButton color="error" onClick={() => deleteTransaction(t.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={transactions.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
          />
        </CardContent>
      </Card>
      

            <Snackbar
              open={snackbar.open}
              autoHideDuration={4000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Alert
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                severity={snackbar.severity}
                variant="filled"
              >
                {snackbar.message}
              </Alert>
            </Snackbar>

    </div>
    
  );
}
