import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import {
  Button, Table, TableHead, TableBody, TableCell, TableRow,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import AddContractDialog from './AddContractDialog';
import ContractMilestoneDialog from './ContractMilestoneDialog';

const ContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const fetchContracts = () => {
    setLoading(true);
    API.get('contracts/')
      .then((res) => {
        setContracts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Error fetching contracts:', err);
        setContracts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const downloadContract = (id, vendorName = '') => {
    API.get(`contracts/${id}/download/`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        const filename = vendorName
          ? `${vendorName.replace(/\s+/g, '_')}_contract.pdf`
          : `contract_${id}.pdf`;
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => console.error('Download failed', err));
  };

  const handleOpenMilestoneDialog = (contract) => {
    setSelectedContract(contract);
    setMilestoneDialogOpen(true);
  };

  const handleDeleteContract = (id) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      API.delete(`contracts/${id}/`)
        .then(() => {
          alert('Contract deleted.');
          fetchContracts();
        })
        .catch((err) => {
          console.error('Error deleting contract:', err);
          alert('Failed to delete contract.');
        });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Contract Management</h2>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          + Add Contract
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Cost Centre</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Contract Date</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.length > 0 ? (
              contracts.map((contract, index) => (
                <TableRow key={contract.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{contract.vendor_name || '—'}</TableCell>
                  <TableCell>{contract.cost_centre_name || '—'}</TableCell>
                  <TableCell>{contract.entity_name || '—'}</TableCell>
                  <TableCell>{contract.description || '—'}</TableCell>
                  <TableCell>
                    {contract.contract_date ? format(new Date(contract.contract_date), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    {contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell>{contract.total_contract_value ?? 0}</TableCell>
                  <TableCell>{contract.total_paid ?? 0}</TableCell>
                  <TableCell>{contract.total_due ?? 0}</TableCell>
                  <TableCell>
                    {contract.document ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => downloadContract(contract.id, contract.vendor_name || '')}
                      >
                        Download
                      </Button>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenMilestoneDialog(contract)}
                      >
                        Milestones
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDeleteContract(contract.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  No contracts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <AddContractDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        onContractAdded={fetchContracts}
      />

      <ContractMilestoneDialog
        open={milestoneDialogOpen}
        handleClose={() => {
          setMilestoneDialogOpen(false);
          fetchContracts(); // refresh on close
        }}
        contract={selectedContract}
      />
    </div>
  );
};

export default ContractManagement;
