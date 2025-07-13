'use client';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';

const sampleInventoryData = [
  {
    _id: '66f1a2b3c4d5e6f7a8b9c0d1',
    status: 'in_progress',
    lastModified: '2025-06-12T08:30:00.000Z',
    updatedAt: '2025-06-12T08:30:00.000Z',
    content: [
      {
        location: {
          row: 'A',
          bay: '01',
          level: '3',
          area: { name: 'Storage Room 1' },
          code: 'A-01-3'
        },
        verified: true,
        verifiedBy: {
          name: 'John Smith',
          id: 'user123'
        },
        result: [
          {
            package: {
              content: {
                name: 'Paracetamol 500mg'
              },
              quantity: 150
            }
          },
          {
            package: {
              content: {
                name: 'Ibuprofen 400mg'
              },
              quantity: 75
            }
          }
        ]
      },
      {
        location: {
          row: 'B',
          bay: '05',
          level: '2',
          area: { name: 'Cold Storage' },
          code: 'B-05-2'
        },
        verified: false,
        verifiedBy: null,
        result: [
          {
            package: {
              content: {
                name: 'Insulin Injection'
              },
              quantity: 25
            }
          }
        ]
      }
    ]
  },
  {
    _id: '66f1a2b3c4d5e6f7a8b9c0d2',
    status: 'pending',
    lastModified: '2025-06-11T14:20:00.000Z',
    updatedAt: '2025-06-11T14:20:00.000Z',
    content: [
      {
        location: {
          row: 'C',
          bay: '12',
          level: '1',
          area: { name: 'Emergency Ward' },
          code: 'C-12-1'
        },
        verified: false,
        verifiedBy: null,
        result: [
          {
            package: {
              content: {
                name: 'Amoxicillin 250mg'
              },
              quantity: 200
            }
          },
          {
            package: {
              content: {
                name: 'Aspirin 100mg'
              },
              quantity: 300
            }
          }
        ]
      }
    ]
  },
  {
    _id: '66f1a2b3c4d5e6f7a8b9c0d3',
    status: 'waiting_approval',
    lastModified: '2025-06-10T16:45:00.000Z',
    updatedAt: '2025-06-10T16:45:00.000Z',
    content: [
      {
        location: {
          row: 'D',
          bay: '08',
          level: '4',
          area: { name: 'Pharmacy' },
          code: 'D-08-4'
        },
        verified: true,
        verifiedBy: {
          name: 'Sarah Johnson',
          id: 'user456'
        },
        result: [
          {
            package: {
              content: {
                name: 'Metformin 500mg'
              },
              quantity: 120
            }
          }
        ]
      },
      {
        location: {
          row: 'D',
          bay: '09',
          level: '4',
          area: { name: 'Pharmacy' },
          code: 'D-09-4'
        },
        verified: true,
        verifiedBy: {
          name: 'Sarah Johnson',
          id: 'user456'
        },
        result: [
          {
            package: {
              content: {
                name: 'Lisinopril 10mg'
              },
              quantity: 90
            }
          }
        ]
      }
    ]
  },
  {
    _id: '66f1a2b3c4d5e6f7a8b9c0d4',
    status: 'completed',
    lastModified: '2025-06-09T10:15:00.000Z',
    updatedAt: '2025-06-09T10:15:00.000Z',
    content: [
      {
        location: {
          row: 'E',
          bay: '03',
          level: '2',
          area: { name: 'ICU Storage' },
          code: 'E-03-2'
        },
        verified: true,
        verifiedBy: {
          name: 'Michael Brown',
          id: 'user789'
        },
        result: [
          {
            package: {
              content: {
                name: 'Morphine 10mg/ml'
              },
              quantity: 50
            }
          },
          {
            package: {
              content: {
                name: 'Epinephrine 1mg/ml'
              },
              quantity: 30
            }
          },
          {
            package: {
              content: {
                name: 'Atropine 0.5mg/ml'
              },
              quantity: 40
            }
          }
        ]
      }
    ]
  },
  {
    _id: '66f1a2b3c4d5e6f7a8b9c0d5',
    status: 'rejected',
    lastModified: '2025-06-08T13:30:00.000Z',
    updatedAt: '2025-06-08T13:30:00.000Z',
    content: [
      {
        location: 'F-07-1',
        verified: false,
        verifiedBy: null,
        result: [
          {
            package: {
              content: {
                name: 'Warfarin 5mg'
              },
              quantity: 80
            }
          }
        ]
      }
    ]
  }
];

function InventoryTable() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [tempLocation, setTempLocation] = useState('');
  const [tempVerified, setTempVerified] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [decodedLocation, setDecodedLocation] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    // Comment out the API call and use sample data
    setTimeout(() => {
      setInventories(sampleInventoryData);
      setLoading(false);
    }, 1000);
  };

  const handleEditClick = (formId, itemIndex, currentLocation) => {
    setEditData({
      formId,
      itemIndex,
      currentLocation
    });
    setTempLocation('');
    setTempVerified(false);
    setLocationError('');
    setDecodedLocation(null);
  };

  const handleVerifyAndSave = async () => {
    try {
      setIsVerifying(true);
      setLocationError('');
      setDecodedLocation(null);

      console.log('🔍 Sending verify location request:', {
        formId: editData.formId,
        locationCode: tempLocation,
        itemIndex: editData.itemIndex
      });

      // Call API to verify and decode location code
      const response = await fetch(`/api/cycle-count-form/${editData.formId}/verify-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locationCode: tempLocation,
          itemIndex: editData.itemIndex
        })
      });

      const result = await response.json();
      console.log('📍 Verify result:', result);

      if (result.success) {
        setDecodedLocation(result.decodedLocation);
        setTempVerified(true);

        // API automatically updates status, just refresh data
        setTimeout(() => {
          handleCloseDialog();
          fetchData(); // Refresh to get new data
        }, 1500);
      } else {
        setLocationError(result.message || 'Error occurred while verifying location');
        console.log('❌ Verify error:', result.message);
      }
    } catch (error) {
      console.error('❌ API call error:', error);
      setLocationError('System error, please try again');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseDialog = () => {
    setEditData(null);
    setTempLocation('');
    setTempVerified(false);
    setLocationError('');
    setDecodedLocation(null);
  };

  const formatLocationString = (location) => {
    if (!location) return 'Not updated';

    // If location is direct string
    if (typeof location === 'string') {
      return location;
    }

    // If location is object
    if (location.code) {
      return location.code;
    }

    // If has separate fields
    if (location.row && location.bay && location.level) {
      const areaName = location.area?.name ? ` (${location.area.name})` : '';
      return `${location.row}-${location.bay}-${location.level}${areaName}`;
    }

    return 'N/A';
  };

  // Function to generate data hash for each row
  const generateDataHash = (form, contentItem, resultItem) => {
    const data = {
      formId: form._id,
      medicineName: resultItem.package?.content?.name,
      quantity: resultItem.package?.quantity,
      location: contentItem.location,
      verified: contentItem.verified
    };

    // Simple hash generation using JSON string
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  };

  // Function to check form status based on content items verification
  const getFormStatus = (form) => {
    const allItemsVerified = form.content.every((item) => item.verified);
    const hasVerifiedItems = form.content.some((item) => item.verified);

    if (allItemsVerified) {
      return { label: 'Pending Approval', color: 'info' };
    } else if (hasVerifiedItems) {
      return { label: 'In Progress', color: 'primary' };
    } else {
      // Fallback to original status if no items verified
      const formStatusMap = {
        in_progress: { label: 'In Progress', color: 'primary' },
        pending: { label: 'Pending Count', color: 'warning' },
        waiting_approval: { label: 'Pending Approval', color: 'info' },
        completed: { label: 'Completed', color: 'success' },
        rejected: { label: 'Rejected', color: 'error' }
      };
      return formStatusMap[form.status] || { label: form.status || 'Pending Count', color: 'warning' };
    }
  };

  // Function to determine package status based on content item verification
  const getPackageStatus = (contentItem) => {
    if (contentItem.verified) {
      return { label: 'Verified', color: 'success' };
    } else {
      return { label: 'Pending Verification', color: 'warning' };
    }
  };

  return (
    <div>
      <Box>
        <Typography variant="h6" gutterBottom>
          Periodic Medicine Inventory Count
        </Typography>

        {loading ? (
          <Typography>Loading data...</Typography>
        ) : (
          <TableContainer
            sx={{
              maxWidth: '100%',
              overflowX: 'auto',
              margin: 0,
              padding: 0
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Form ID</TableCell>
                  <TableCell>Data Hash</TableCell>
                  <TableCell>Medicine Name</TableCell>
                  <TableCell>Package Quantity</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Location Confirmed</TableCell>
                  <TableCell>Package Status</TableCell>
                  <TableCell>Form Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventories.flatMap((form, formIndex) =>
                  form.content.flatMap((contentItem, contentIndex) =>
                    contentItem.result.map((resultItem, resultIndex) => {
                      // Package status based on content item verification
                      const packageStatus = getPackageStatus(contentItem);

                      // Form status based on all content items
                      const formStatus = getFormStatus(form);

                      // Generate unique key for each row
                      const uniqueKey = `${form._id}-${contentIndex}-${resultIndex}`;

                      // Format location string
                      const locationString = formatLocationString(contentItem.location);

                      // Generate data hash
                      const dataHash = generateDataHash(form, contentItem, resultItem);

                      return (
                        <TableRow key={uniqueKey}>
                          <TableCell>{form._id ? form._id.slice(-8) : 'N/A'}</TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {dataHash}
                            </Typography>
                          </TableCell>

                          <TableCell>{resultItem.package?.content?.name || 'N/A'}</TableCell>

                          <TableCell>{resultItem.package?.quantity || 0}</TableCell>

                          <TableCell>{locationString}</TableCell>

                          <TableCell>
                            <Checkbox checked={!!contentItem.verified} color="primary" disabled />
                            {contentItem.verifiedBy && (
                              <Typography variant="caption" display="block">
                                {contentItem.verifiedBy.name || contentItem.verifiedBy}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip label={packageStatus.label} color={packageStatus.color} size="small" />
                          </TableCell>

                          <TableCell>
                            <Chip label={formStatus.label} color={formStatus.color} size="small" variant="outlined" />
                          </TableCell>

                          <TableCell>
                            {form.lastModified
                              ? new Date(form.lastModified).toLocaleString('en-US')
                              : form.updatedAt
                                ? new Date(form.updatedAt).toLocaleString('en-US')
                                : ''}
                          </TableCell>

                          <TableCell>
                            <IconButton
                              onClick={() => handleEditClick(form._id, contentIndex, locationString)}
                              title="Verify location"
                              disabled={contentItem.verified} // Disable if already verified
                            >
                              <EditIcon color={contentItem.verified ? 'disabled' : 'action'} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Location verification dialog */}
      <Dialog open={!!editData} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Verify Medicine Location
          {editData && (
            <Typography variant="subtitle2" color="textSecondary">
              Location to verify: {editData.currentLocation}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Scan/Enter QR location code"
            value={tempLocation}
            onChange={(e) => setTempLocation(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Paste base64 code here..."
            disabled={isVerifying}
            multiline
            rows={2}
          />

          {isVerifying && (
            <Alert severity="info" style={{ marginTop: '10px' }}>
              Verifying and updating location...
            </Alert>
          )}

          {/* Display error message */}
          {locationError && (
            <Alert severity="error" style={{ marginTop: '10px' }}>
              {locationError}
            </Alert>
          )}

          {/* Display location info if decode successful */}
          {decodedLocation && (
            <Alert severity="success" style={{ marginTop: '10px' }}>
              ✅ Location confirmed: {decodedLocation}
              <br />
              <small>Package status automatically updated to "Verified"</small>
            </Alert>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
            <Checkbox
              checked={tempVerified}
              onChange={(e) => setTempVerified(e.target.checked)}
              color="primary"
              disabled={true} // Always disabled as it's automatically set
            />
            <span>Confirm location accuracy</span>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isVerifying}>
            {decodedLocation ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleVerifyAndSave}
            color="primary"
            variant="contained"
            disabled={!tempLocation.trim() || isVerifying || !!decodedLocation}
          >
            {isVerifying ? 'Verifying...' : 'Verify Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default InventoryTable;
