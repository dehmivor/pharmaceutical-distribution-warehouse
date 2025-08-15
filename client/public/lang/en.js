export default {
  // Header và Navigation
  header: {
    title: 'Manage User',
    description: 'Administer and oversee user accounts and privileges within the platform',
    home: 'Home',
    dashboard: 'Dashboard',
    profile: 'Profile',
    logout: 'Logout',
    settings: 'Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    rtlMode: 'RTL Mode'
  },
  
  // Tabs
  tabs: {
    users: 'Users',
    permissions: 'Permissions',
    inventory: 'Inventory',
    orders: 'Orders',
    reports: 'Reports',
    import: 'Import',
    export: 'Export',
    bills: 'Bills',
    contracts: 'Contracts',
    logs: 'Logs'
  },
  
  // Common actions
  actions: {
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password',
    contactSupport: 'Contact support'
  },
  
  // Status
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    processing: 'Processing'
  },
  
  // Messages
  messages: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading...',
    noData: 'No data available',
    confirmDelete: 'Are you sure you want to delete this item?',
    saveSuccess: 'Data saved successfully',
    deleteSuccess: 'Item deleted successfully',
    welcomeBack: 'Welcome back! Select the method of login.',
    signUpFree: 'Sign Up for free. No credit card required.',
    alreadyHaveAccount: 'Already have an account?',
    needHelp: 'Need help?',
    forgotPasswordDescription: 'Enter your email address and we\'ll send you a link to reset your password.',
    needApproval: 'Need to approve pending import/export orders',
    needCheckLowStock: 'Need to check and replenish low stock medicines',
    emailRequired: 'Email is required',
    invalidEmailFormat: 'Invalid email format',
    roleRequired: 'Role is required',
    passwordRequired: 'Password is required when not auto-generating',
    passwordMinLength: 'Password must be at least 6 characters',
    failedCreateUser: 'Failed to create user',
    failedCreateUserRetry: 'Failed to create user. Please try again.'
  },
  
  // Form labels
  form: {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    role: 'Role',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    description: 'Description',
    quantity: 'Quantity',
    price: 'Price',
    date: 'Date'
  },
  
  // Roles
  roles: {
    supervisor: 'Supervisor',
    representative: 'Representative',
    warehouse: 'Warehouse',
    warehouse_manager: 'Warehouse Manager',
    representative_manager: 'Representative Manager',
    admin: 'Administrator',
    delivery: 'Delivery Unit',
    supplier: 'Supplier'
  },
  
  // Breadcrumbs
  breadcrumbs: {
    home: 'Home',
    dashboard: 'Dashboard',
    users: 'Users',
    inventory: 'Inventory',
    orders: 'Orders'
  },
  
  // Data tracking and alerts
  dataTracking: {
    title: 'Data Tracking',
    description: 'Track system data and trends'
  },
  alerts: {
    title: 'System Alerts',
    description: 'Display expired medicine batches and related alerts',
    systemTitle: 'Pharmaceutical Warehouse Management System Alerts',
    noBatches: 'No batches for {months} months.',
    expiredUnder6: 'under 6',
    expiredAfter: 'after about {months}',
    months: 'months',
    batchCode: 'Batch Code',
    medicineName: 'Medicine Name',
    expiryDate: 'Expiry Date',
    remainingQuantity: 'Remaining Quantity',
    supplier: 'Supplier',
    action: 'Action',
    createDestroyTicket: 'Create Destroy Ticket',
    noAlerts: 'No alerts.',
    otherAlerts: 'Other Alerts',
    rowsPerPage: 'Rows per page:',
    displayedRows: '{from}-{to} of {count}',
    lowInventory: 'Low Inventory',
    expiredBatch: 'Expired Batch',
    recall: 'Recall',
    newEntry: 'New Entry',
    info: 'Info',
    handled: 'Handled',
    lowInventoryMessage: 'Medicine {name} only has {quantity} bottles left.',
    createDestroyTicketMessage: 'Create destroy ticket for batch: {code}',
    dataFetchError: 'Could not fetch expired batch data',
    apiError: 'API call error: {message}'
  },
  
  // Menu items
  menu: {
    manage: 'Manage',
    userRoleManagement: 'User & Role Management',
    manageUsers: 'Manage Users',
    orderManagement: 'Order Management',
    importOrders: 'Import Orders',
    exportOrders: 'Export Orders',
    medicineManagement: 'Medicine Management',
    manageMedicines: 'Manage Medicines',
    billManagement: 'Bill Management',
    payBills: 'Pay Bills',
    reportBills: 'Report Bills',
    inventoryManagement: 'Inventory Management',
    inventoryCheckOrders: 'Inventory Check Orders',
    managePackages: 'Manage Packages',
    locationManagement: 'Location Management',
    manageAreas: 'Manage Areas',
    manageLocations: 'Manage Locations',
    contractManagement: 'Contract Management',
    retailerManagement: 'Retailer Management',
    supplierManagement: 'Supplier Management',
    logManagement: 'Log Management',
    dataReports: 'Data & Reports',
    dashboard: 'Dashboard',
    reports: 'Reports',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    dataTracking: 'Data Tracking',
    trends: 'Trends',
    alerts: 'Alerts',
    other: 'Other',
    others: 'Others',
    equipmentManagement: 'Equipment Management',
    support: 'Support',
    updates: 'Updates',
    changelog: 'Changelog'
  },
  
  // Dashboard
  dashboard: {
    title: 'Supervisor Dashboard',
    description: 'Pharmaceutical warehouse management system overview - Manage all roles',
    overview: 'Overview',
    statistics: 'Statistics',
    importOrders: 'Import Orders',
    exportOrders: 'Export Orders',
    activeContracts: 'Active Contracts',
    totalMedicines: 'Total Medicines',
    totalSuppliers: 'Total Suppliers',
    totalRetailers: 'Total Retailers',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Total Expenses',
    pendingApprovals: 'Pending Approvals',
    lowStockItems: 'Low Stock Items',
    recentOrders: 'Recent Orders',
    topMedicines: 'Top Medicines',
    lowStockMedicines: 'Low Stock Medicines',
    systemStatus: 'System Status',
    roleActivity: 'Role Activity',
    representatives: 'Representatives',
    representativeManagers: 'Representative Managers',
    warehouseStaff: 'Warehouse Staff',
    warehouseManagers: 'Warehouse Managers',
    supervisors: 'Supervisors',
    totalOrders: 'Total Orders',
    activeUsers: 'Active Users',
    totalApprovals: 'Total Approvals',
    totalOperations: 'Total Operations',
    items: 'items',
    noData: 'No data available'
  },
  
  // Import Orders
  importOrders: {
    title: 'Import Orders Management',
    description: 'Supervisor can view import orders',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    refresh: 'Refresh',
    allStatus: 'All Status',
    noOrdersFound: 'No orders found.',
    orderDetails: 'Import Order Details',
    contractStatus: 'Contract Status',
    orderDetailsSection: 'Order Details',
    na: 'N/A'
  },
  
  // Export Orders
  exportOrders: {
    title: 'Export Orders Management',
    description: 'Supervisor can view export orders',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    refresh: 'Refresh',
    allStatus: 'All Status',
    noOrdersFound: 'No orders found.',
    orderDetails: 'Export Order Details',
    contractStatus: 'Contract Status',
    orderDetailsSection: 'Order Details',
    na: 'N/A',
    completed: 'Completed',
    cancelled: 'Cancelled',
    statusUpdatedSuccess: 'Status updated successfully'
  },
  
  // Bill Management
  bills: {
    title: 'Bills Management',
    description: 'Pay bill and search, sort, filter bill with status, type, date',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    refresh: 'Refresh',
    allStatus: 'All Status',
    noBillsFound: 'No bills found.',
    billDetails: 'Bill Details',
    paymentAmount: 'Payment Amount',
    paymentProcessing: 'Processing...',
    payment: 'Payment',
    cancel: 'Cancel',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    confirmStatusChange: 'Confirm Status Change',
    confirmStatusChangeMessage: 'Are you sure you want to change the status of this bill?',
    confirmStatusChangeWarning: 'This action cannot be undone.',
    processing: 'Processing...',
    paymentError: 'Payment Error',
    paymentSuccess: 'Payment Success',
    paymentFailed: 'Payment Failed',
    paymentProcessingError: 'Payment processing error',
    paymentConnectionError: 'Payment connection error',
    invalidAmount: 'Please enter a valid payment amount.',
    invalidTotalAmount: 'Total payment amount is invalid.',
    noClientSecret: 'No payment client secret received.',
    stripeSessionError: 'Unable to create Stripe payment session.',
    multiPaymentError: 'Unable to create payment session for multiple bills.',
    multiPaymentConnectionError: 'Payment connection error for multiple bills. Please try again later.',
    dataLoadError: 'Error loading bill data',
    paymentIntentError: 'Error creating PaymentIntent, please try again.',
    stripeConnectionError: 'Error connecting to payment. Please try again later.',
    tableHeaders: {
      billCode: 'Bill Code',
      type: 'Type',
      status: 'Status',
      createdDate: 'Created Date',
      medicineDetails: 'Medicine Details (Code)',
      totalAmount: 'Total Amount (VND)',
      actions: 'Actions'
    },
    noData: 'No data available',
    paymentTypes: {
      partial: 'Partial Payment',
      full: 'Full Payment'
    },
    partialPayment: 'Partial Payment',
    singlePayment: 'Single Payment'
  },
  
  // Reports
  reports: {
    title: 'Reports',
    billsReport: 'Bills Report',
    summary: 'Summary',
    filters: 'Filters',
    search: 'Search',
    refresh: 'Refresh',
    download: 'Download',
    upload: 'Upload',
    noDataFound: 'No data found',
    loading: 'Loading...',
    error: 'Error',
    failedToLoad: 'Failed to load report data',
    failedToExport: 'Failed to export report',
    fileUploadedSuccess: 'File uploaded successfully!',
    startDate: 'Start Date',
    endDate: 'End Date',
    period: 'Period',
    status: 'Status',
    type: 'Type',
    partnerType: 'Partner Type',
    reportType: 'Report Type',
    all: 'All',
    monthly: 'Monthly',
    weekly: 'Weekly',
    yearly: 'Yearly',
    comprehensive: 'Comprehensive',
    export: 'Export',
    import: 'Import',
    billCode: 'Bill Code',
    contractCode: 'Contract Code',
    partnerType: 'Partner Type',
    orderCode: 'Order Code',
    orderType: 'Order Type',
    totalValue: 'Total Value',
    amountPaid: 'Amount Paid',
    remainingAmount: 'Remaining Amount',
    createdAt: 'Created At',
    rowsPerPage: 'Rows per page:',
    of: 'of',
    moreThanTo: 'more than',
    noDataToDisplay: 'No data to display',
    tryChangingFiltersOrCheckingData: 'Try changing filters or check data again',
    uploadExcelFile: 'Upload Excel File',
    selectExcelFile: 'Select Excel File',
    selectedFile: 'Selected file'
  },
  
  // Supplier Management
  suppliers: {
    title: 'Supplier Management',
    description: 'Manage pharmaceutical suppliers and their information',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    refresh: 'Refresh',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    noSuppliersFound: 'No suppliers found',
    loading: 'Loading...',
    error: 'Error',
    addNew: 'Add New',
    editSupplier: 'Edit Supplier',
    supplierDetails: 'Supplier Details',
    name: 'Name',
    address: 'Address',
    phone: 'Phone',
    license: 'License',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    nameRequired: 'Supplier name is required',
    licenseRequired: 'License number is required',
    phoneFormat: 'Phone number must have format: +84 28 3999 1111',
    phonePlaceholder: '+84 28 3999 1111',
    errorLoading: 'Error loading supplier list',
    errorOccurred: 'An error occurred',
    errorDeleting: 'An error occurred while deleting',
    deleteSuccess: 'Supplier deleted successfully',
    saveSuccess: 'Supplier saved successfully'
  },
  
  // Retailer Management
  retailers: {
    title: 'Retailer Management',
    description: 'Manage pharmaceutical retailers and their information',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    refresh: 'Refresh',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    noRetailersFound: 'No retailers found',
    loading: 'Loading...',
    error: 'Error',
    addNew: 'Add New',
    editRetailer: 'Edit Retailer',
    retailerDetails: 'Retailer Details',
    name: 'Name',
    address: 'Address',
    phone: 'Phone',
    license: 'License',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    nameRequired: 'Retailer name is required',
    licenseRequired: 'License number is required',
    phoneFormat: 'Format: XXX-XXXX-XXXX',
    phonePlaceholder: '028-3831-7890',
    errorLoading: 'Error loading retailer list',
    errorOccurred: 'An error occurred',
    errorDeleting: 'An error occurred while deleting',
    deleteSuccess: 'Retailer deleted successfully',
    saveSuccess: 'Retailer saved successfully',
    detailTitle: 'Retailer Details'
  },
  
  // Log Management
  logs: {
    title: 'Location Log Management',
    description: 'Manage and view location change logs',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    refresh: 'Refresh',
    noLogsFound: 'No logs found',
    loading: 'Loading...',
    error: 'Error',
    failedToLoad: 'Failed to load logs',
    startDate: 'Start Date',
    endDate: 'End Date',
    worker: 'Worker',
    order: 'Order',
    area: 'Area',
    bay: 'Bay',
    row: 'Row',
    column: 'Column',
    add: 'Add',
    remove: 'Remove'
  },
  
  // Contract Details
  contracts: {
    title: 'Contract Details',
    description: 'View detailed contract information',
    status: 'Status',
    actions: 'Actions',
    close: 'Close',
    basicInformation: 'Basic Information',
    contractInformation: 'Contract Information',
    partnerInformation: 'Partner Information',
    draft: 'Draft',
    pending: 'Pending Approval',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
    economic: 'Economic',
    principal: 'Principal',
    supplier: 'Supplier',
    retailer: 'Pharmacy',
    contractCode: 'Contract Code',
    contractType: 'Contract Type',
    partnerType: 'Partner Type',
    partnerName: 'Partner Name',
    createdBy: 'Created By',
    effectiveTime: 'Effective Time',
    startDate: 'Start Date',
    endDate: 'End Date',
    medicineDetails: 'Medicine Details',
    medicineName: 'Medicine Name',
    medicineCode: 'Medicine Code',
    unitPrice: 'Unit Price',
    quantity: 'Quantity',
    amount: 'Amount',
    total: 'Total',
    additionalInfo: 'Additional Information',
    createdDate: 'Created Date',
    lastUpdated: 'Last Updated',
    draft: 'Draft',
    economic: 'Economic',
    principal: 'Principal',
    basicInfo: 'Basic Information',
    effectiveTime: 'Effective Time',
    medicineList: 'Medicine List',
    additionalInfo: 'Additional Information'
  },

  // Home page
  home: {
    title: 'Supervisor Dashboard',
    description: 'Welcome to the supervisor management section. Select a category to manage.',
    availableActions: 'Available Actions:',
    sections: {
      userManagement: {
        title: 'User & Role Management',
        description: 'Manage users and their roles in the system'
      },
      orderManagement: {
        title: 'Order Management',
        description: 'Import and export order management',
        importOrders: 'Import Orders',
        exportOrders: 'Export Orders'
      },
      medicineManagement: {
        title: 'Medicine Management',
        description: 'Manage medicines and inventory',
        manageMedicines: 'Manage Medicines'
      },
      billManagement: {
        title: 'Bill Management',
        description: 'Manage bills and financial records',
        manageBills: 'Manage Bills',
        viewDashboardBills: 'View Dashboard Bills'
      },
      inventoryManagement: {
        title: 'Inventory Management',
        description: 'Inventory check and management',
        inventoryCheckOrders: 'Inventory Check Orders'
      },
      locationManagement: {
        title: 'Location Management',
        description: 'Manage areas and locations',
        manageAreas: 'Manage Areas',
        manageLocations: 'Manage Locations'
      },
      contractManagement: {
        title: 'Contract Management',
        description: 'Manage retailer and supplier contracts',
        retailerManagement: 'Retailer Management',
        supplierManagement: 'Supplier Management'
      }
    }
  },

  // Contract management page
  contractManagement: {
    title: 'Contract Management',
    description: 'Select a contract type to manage.',
    retailerManagement: {
      title: 'Retailer Management',
      description: 'Add, edit, delete and manage retailer information'
    },
    supplierManagement: {
      title: 'Supplier Management',
      description: 'Add, edit, delete and manage supplier information'
    }
  },

  // User management and permissions
  userManagement: {
    title: 'User & Role Management',
    addNewUser: 'Add New User',
    updateUserPermissions: 'Update User Permissions',
    permissionManagement: 'Permission Management',
    user: 'User',
    role: 'Role',
    managerPrivileges: 'Manager Privileges',
    cancel: 'Cancel',
    updatePermissions: 'Update Permissions',
    creating: 'Creating...',
    createUser: 'Create User',
    emailAddress: 'Email Address',
    customPassword: 'Custom Password',
    minimumCharacters: 'Minimum 6 characters required',
    accountActivationProcess: 'Account Activation Process',
    accountActivationDescription: 'An email will be sent to the user with activation instructions. The user must complete the activation process to access their account.',
    loading: 'Loading user data...',
    error: 'Error',
    retry: 'Retry',
    noUsersInSection: 'No users in {sectionName}',
    roles: {
      warehouse: 'Warehouse',
      warehouseManager: 'Warehouse Manager',
      representative: 'Representative',
      representativeManager: 'Representative Manager',
      supervisor: 'Supervisor',
      delivery: 'Delivery Unit',
      supplier: 'Supplier'
    }
  },

  // Supplier form
  supplierForm: {
    supplierName: 'Supplier Name',
    contactEmail: 'Contact Email',
    businessType: 'Business Type',
    contactPerson: 'Contact Person',
    phoneNumber: 'Phone Number',
    address: 'Address',
    supplierCategory: 'Supplier Category',
    taxId: 'Tax ID',
    isPreferred: 'Is Preferred',
    enterSupplierName: 'Enter supplier name',
    enterContactEmail: 'Enter contact email',
    enterContactPerson: 'Enter contact person name',
    enterPhoneNumber: 'Enter phone number',
    enterAddress: 'Enter address',
    enterTaxId: 'Enter tax ID',
    manufacturer: 'Manufacturer',
    distributor: 'Distributor',
    wholesaler: 'Wholesaler',
    serviceProvider: 'Service Provider',
    row1: 'Row 1: 2 fields',
    row2: 'Row 2: 3 fields',
    row3: 'Row 3: 3 fields',
    row4: 'Row 4: Tax ID field'
  },

  // Warehouse form
  warehouseForm: {
    username: 'Username',
    accountEmail: 'Account Email',
    language: 'Language',
    warehouseName: 'Signing Username',
    phoneNumber: 'Phone Number',
    address: 'Address',
    warehouseType: 'Warehouse Type',
    capacity: 'Capacity',
    isManager: 'Is Manager',
    enterUsername: 'Enter username',
    enterAccountEmail: 'Enter account email',
    enterSigningUsername: 'Enter signing username',
    enterPhoneNumber: 'Enter phone number',
    enterAddress: 'Enter address',
    enterCapacity: 'Enter capacity',
    row1: 'Row 1: 2 fields',
    row2: 'Row 2: 3 fields',
    row3: 'Row 3: 3 fields',
    hindi: 'Hindi',
    english: 'English',
    vietnamese: 'Vietnamese'
  },

  // Delivery form
  deliveryForm: {
    deliveryId: 'Delivery ID',
    customerName: 'Customer Name',
    deliveryStatus: 'Delivery Status',
    driverName: 'Driver Name',
    phoneNumber: 'Phone Number',
    deliveryAddress: 'Delivery Address',
    deliveryType: 'Delivery Type',
    estimatedTime: 'Estimated Time',
    isUrgent: 'Is Urgent',
    enterDeliveryId: 'Enter delivery ID',
    enterCustomerName: 'Enter customer name',
    enterDriverName: 'Enter driver name',
    enterPhoneNumber: 'Enter phone number',
    enterDeliveryAddress: 'Enter delivery address',
    enterEstimatedTime: 'Enter estimated time',
    row1: 'Row 1: 2 fields',
    row2: 'Row 2: 3 fields',
    row3: 'Row 3: 3 fields',
    row4: 'Row 4: Estimated time',
    pending: 'Pending',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  },

  // Representative form
  representativeForm: {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phoneNumber: 'Phone Number',
    employeeId: 'Employee ID',
    department: 'Department',
    position: 'Position',
    hireDate: 'Hire Date',
    birthDate: 'Birth Date',
    gender: 'Gender',
    address: 'Address',
    city: 'City',
    country: 'Country',
    zipCode: 'Zip Code',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: 'Emergency Phone',
    salary: 'Salary',
    experienceLevel: 'Experience Level',
    skills: 'Skills',
    languages: 'Languages',
    isActive: 'Is Active',
    isManager: 'Is Manager',
    hasDriverLicense: 'Has Driver License',
    workingHours: 'Working Hours',
    performanceRating: 'Performance Rating',
    notes: 'Notes',
    enterFirstName: 'Enter first name',
    enterLastName: 'Enter last name',
    enterEmail: 'Enter email',
    enterPhoneNumber: 'Enter phone number',
    enterEmployeeId: 'Enter employee ID',
    enterAddress: 'Enter address',
    enterCity: 'Enter city',
    enterZipCode: 'Enter zip code',
    enterEmergencyContact: 'Enter emergency contact',
    enterEmergencyPhone: 'Enter emergency phone',
    enterNotes: 'Enter notes',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    communication: 'Communication',
    leadership: 'Leadership',
    problemSolving: 'Problem Solving',
    timeManagement: 'Time Management',
    teamwork: 'Teamwork',
    technicalSkills: 'Technical Skills',
    sales: 'Sales',
    customerService: 'Customer Service',
    personalInformation: 'Personal Information',
    workInformation: 'Work Information',
    contactInformation: 'Contact Information',
    additionalInformation: 'Additional Information',
    employeeId: 'Employee ID',
    department: 'Department',
    position: 'Position',
    hireDate: 'Hire Date',
    workingHours: 'Working Hours',
    annualSalary: 'Annual Salary',
    experience: 'Experience',
    performanceRating: 'Performance Rating',
    enterPosition: 'Enter position',
    sales: 'Sales',
    marketing: 'Marketing',
    hr: 'Human Resources',
    it: 'Information Technology',
    finance: 'Finance',
    operations: 'Operations',
    internship: 'Internship'
  },

  // Simple page placeholders
  placeholders: {
    support: 'Support',
    updates: 'Updates',
    changelog: 'Changelog',
    monthly: 'Monthly',
    weekly: 'Weekly',
    yearly: 'Yearly',
    trends: 'Trends'
  },

  // Supervisor approval
  supervisorApproval: {
    title: 'Approve Warehouse Receipt - {id}',
    receiptInfo: 'Receipt Information',
    createdDate: 'Created Date',
    createdBy: 'Created By',
    supplier: 'Supplier',
    totalValue: 'Total Value',
    receivedPercentage: 'Received Percentage',
    status: 'Status',
    pendingApproval: 'Pending Approval',
    approvalDecision: 'Approval Decision',
    decision: 'Decision',
    approved: 'Approve',
    rejected: 'Reject',
    requestChanges: 'Request Changes',
    reviewer: 'Reviewer',
    comments: 'Comments',
    commentsPlaceholder: 'Enter comments about the warehouse receipt...',
    confirmDecision: 'Confirm Decision',
    reset: 'Reset',
    noPermission: 'You do not have permission to approve this warehouse receipt.',
    confirmDialogTitle: 'Confirm Approval Decision',
    confirmMessage: 'Are you sure you want to {action} warehouse receipt {id}?',
    commentsLabel: 'Comments:',
    cancel: 'Cancel',
    confirm: 'Confirm',
    receiptInfo: 'Receipt Information',
    approvalForm: 'Approval Form',
    confirmDialog: 'Confirmation Dialog'
  },

  // User management messages
  messages: {
    emailRequired: 'Email is required',
    invalidEmailFormat: 'Invalid email format',
    roleRequired: 'Role is required',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 6 characters',
    failedCreateUser: 'Failed to create user',
    failedCreateUserRetry: 'Failed to create user. Please try again.'
  },

  // Header section
  header: {
    title: 'User Account Management',
    description: 'Manage user accounts, roles, and permissions in the system'
  },

  // Tabs
  tabs: {
    users: 'Users',
    permissions: 'Permissions'
  },

  // Actions
  actions: {
    add: 'Add'
  },

  // Roles
  roles: {
    warehouse: 'Warehouse',
    representative: 'Representative',
    supplier: 'Supplier'
  },

  // Import Orders
  importOrders: {
    title: 'Import Orders Management',
    description: 'Manage and monitor import orders from suppliers',
    refresh: 'Refresh',
    status: 'Status',
    allStatus: 'All Status',
    search: 'Search',
    actions: 'Actions',
    noOrdersFound: 'No orders found',
    orderDetails: 'Order Details',
    contractStatus: 'Contract Status',
    na: 'N/A'
  },

  // Export Orders
  exportOrders: {
    title: 'Export Orders Management',
    description: 'Manage and monitor export orders to retailers',
    refresh: 'Refresh',
    status: 'Status',
    allStatus: 'All Status',
    search: 'Search',
    actions: 'Actions',
    noOrdersFound: 'No orders found',
    statusUpdatedSuccess: 'Status updated successfully'
  },

  // Common form labels and actions
  common: {
    // Basic UI elements
    na: 'N/A',
    currency: 'VND',
    loading: 'Loading...',
    close: 'Close',
    cancel: 'Cancel',
    refresh: 'Refresh',
    clearFilters: 'Clear Filters',
    
    // Menu translations
    representative: 'Representative',
    dashboard: 'Dashboard',
    representativeManager: 'Representative Manager',
    representativeManagerDashboard: 'Representative Manager Dashboard',
    warehouse: 'Warehouse',
    warehouseManager: 'Warehouse Manager',
    supervisor: 'Supervisor',
    
    // Contract Management
    contractManagement: 'Contract Management',
    manageContractList: 'Manage contract list and status',
    addContract: 'Add Contract',
    addContractSuccess: 'Contract added successfully!',
    updateContractSuccess: 'Contract updated successfully!',
    deleteContractSuccess: 'Contract deleted successfully!',
    deleteContract: 'Delete Contract',
    confirmAction: 'Confirmed',
    cancelContract: 'Cancel Contract',
    errorOccurred: 'An error occurred',
    annex: 'Annex',
    annexActionSuccess: 'Annex operation completed successfully!',
    
    // Contract Types
    economicContract: 'Economic',
    principalContract: 'Principal',
    
    // Partner Types
    partnerType: 'Partner Type',
    supplierLabel: 'Supplier',
    retailerLabel: 'Retailer',
    partner: 'Partner',
    
    // Status
    status: 'Status',
    allStatuses: 'All Statuses',
    draft: 'Draft',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    returned: 'Returned',
    cancelled: 'Cancelled',
    
    // Actions
    actions: 'Actions',
    viewDetails: 'View Details',
    edit: 'Edit',
    delete: 'Delete',
    draftAction: 'Move to Draft',
    reject: 'Reject',
    approveAnnex: 'Approve Annex',
    
    // Table Headers
    contractCode: 'Contract Code',
    contractType: 'Contract Type',
    createdBy: 'Created By',
    warehouseManager: 'Warehouse Manager',
    
    // Pagination
    all: 'All',
    
    // Medicine
    medicine: 'Medicine',
    selectMedicine: 'Select Medicine',
    quantity: 'Quantity',
    orderQuantity: 'Order Quantity',
    medicineLabel: 'Medicine',
    selectMedicinePlaceholder: 'Select Medicine',
    
    // Selection
    select: 'Select',
    selectPartnerType: 'Select Partner Type',
    
    // Amount and Pricing
    totalAmount: 'Total Amount',
    totalAmountLabel: 'Total Amount',
    unitPrice: 'Unit Price',
    total: 'Total',
    
    // Information
    basicInformation: 'Basic Information',
    orderDetailsTitle: 'Order Details',
    
    // Contract
    contract: 'Contract',
    supplier: 'Supplier',
    
    // Import/Export Orders
    manageImportOrders: 'Manage Import Orders',
    createImportOrder: 'Create Import Order',
    editImportOrder: 'Edit Import Order',
    exportOrders: 'Export Orders',
    createExportOrder: 'Create Export Order',
    editExportOrder: 'Edit Export Order',
    createNewOrder: 'Create New Order',
    
    // Search and Filter
    searchFilter: 'Search & Filter',
    contractCodePlaceholder: 'Enter contract code...',
    allContractTypes: 'All Contract Types',
    allSuppliers: 'All Suppliers',
    allUsers: 'All Users',
    
    // Selection Messages
    selectContractType: 'Select Contract Type',
    selectContract: 'Select Contract',
    pleaseSelectContractTypeAndContract: 'Please select contract type and contract',
    pleaseSelectContractType: 'Please select contract type first',
    pleaseSelectContract: 'Please select contract first',
    
    // Order Details
    orderDetails: 'Order Details',
    editMedicinesOnlyNote: 'Edit medicines only',
    quantityEditableNote: 'Quantity editable',
    editMedicinesOnly: 'You can only edit medicines in this order',
    editOrderNote: 'You can only edit medicines in this order',
    
    // Contract Type Notes
    principalContractQuantityEditable: 'Principal contract: Quantity can be edited',
    principalContractQuantityEditableNote: 'Principal contract: Quantity can be edited',
    economicContractAutoFilled: 'Economic contract: Auto-filled from contract',
    economicContractWarning: 'Economic contract: Quantity cannot be edited',
    
    // Medicine Management
    pleaseAddMedicines: 'Please add medicines to the order',
    addMedicine: 'Add Medicine',
    addMedicineQuantityOnly: 'Add Medicine (Quantity Only)',
    fromContract: 'From contract (read-only)',
    fromContractEconomicCannotEdit: 'From contract (Economic - cannot edit)',
    fromContractCannotEdit: 'From contract (cannot edit)',
    
    // Validation Messages
    duplicateMedicineError: 'Duplicate medicine selected',
    pleaseFillAllFields: 'Please fill all required fields',
    quantityMaxForMedicine: 'Quantity for {medicine} cannot exceed {max}',
    
    // Stock Management
    stockInformation: 'Stock Information',
    checkingStock: 'Checking stock availability...',
    stockCheckError: 'Stock check error: {error}',
    sufficientStock: 'Sufficient stock available',
    insufficientStock: 'Insufficient stock available',
    stockSummary: 'Stock Summary',
    totalMedicines: 'Total: {count} medicines',
    sufficientMedicines: 'Sufficient: {count}',
    insufficientMedicines: 'Insufficient: {count}',
    insufficientStockButton: 'Insufficient Stock',
    
    // Order Creation
    creating: 'Creating...',
    checkingStockButton: 'Checking Stock...',
    createOrder: 'Create Order',
    
    // Order Status Messages
    noExportOrdersFound: 'No export orders found',
    editingRejectedExportOrder: 'Editing rejected export order',
    
    // Stock Status
    sufficient: 'Sufficient',
    insufficient: 'Insufficient',
    
    // Representative Manager Menu
    importOrdersApproval: 'Import Orders Approval',
    exportOrdersApproval: 'Export Orders Approval',
    manageContracts: 'Manage Contracts',
    medicinePerformance: 'Medicine Performance',
    
    // Breadcrumbs
    breadcrumbs: {
      home: 'Home'
    }
  },

  // Breadcrumbs
  breadcrumbs: {
    home: 'Home'
  },

  // Representative Manager Export Orders Approval
  representativeManagerExportOrdersApproval: {
    title: 'Approve Export Orders',
    filters: {
      title: 'Search Filters',
      search: 'Search',
      searchPlaceholder: 'Order ID, Contract code...',
      status: 'Status',
      allStatus: 'All',
      contractType: 'Contract Type',
      allContractTypes: 'All',
      economic: 'Economic',
      principal: 'Principal',
      createdBy: 'Created By',
      allUsers: 'All',
      refresh: 'Refresh',
      clearFilters: 'Clear Filters'
    },
    table: {
      title: 'Export Orders List',
      totalOrders: 'Total orders',
      contract: 'Contract',
      createdBy: 'Created By',
      status: 'Status',
      actions: 'Actions',
      noOrders: 'No export orders to process.',
      loadingOrders: 'Loading orders...'
    },
    actions: {
      approve: 'Approve',
      reject: 'Reject',
      viewDetails: 'View Details',
      approving: 'Approving...',
      rejecting: 'Rejecting...'
    },
    dialogs: {
      approve: {
        title: 'Approve Export Order',
        message: 'Are you sure you want to approve this export order?',
        cancel: 'Cancel'
      },
      reject: {
        title: 'Reject Export Order',
        message: 'Are you sure you want to reject this export order?',
        cancel: 'Cancel'
      },
      details: {
        title: 'Export Order Details',
        basicInfo: 'Basic Information',
        contract: 'Contract',
        createdBy: 'Created By',
        status: 'Status',
        warehouseManager: 'Warehouse Manager',
        orderOverview: 'Order Overview',
        medicineTypes: 'Medicine Types',
        totalAmount: 'Total Amount',
        medicineList: 'Medicine List',
        medicine: 'Medicine',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        total: 'Total',
        grandTotal: 'Grand Total',
        close: 'Close'
      }
    },
    messages: {
      orderApproved: 'Order approved!',
      orderRejected: 'Order rejected!'
    }
  },

  // Status Change Dialog
  statusChangeDialog: {
    approve: {
      title: 'Approve Order',
      message: 'Are you sure you want to approve this import order?',
      confirmText: 'Approve'
    },
    reject: {
      title: 'Reject Order',
      message: 'Are you sure you want to reject this import order?',
      confirmText: 'Reject'
    },
    cancel: 'Cancel',
    loading: 'Processing...',
    orderInfo: 'Order Information',
    orderId: 'Order ID',
    currentStatus: 'Current Status',
    newStatus: 'New Status',
    userRole: 'User Role'
  },

  // Representative Manager Import Orders
  representativeManagerImportOrders: {
    title: 'Import Orders Management',
    description: 'Approve or reject draft import orders',
    filters: {
      title: 'Search Filters',
      search: 'Search',
      searchPlaceholder: 'Order ID, Supplier name...',
      status: 'Status',
      allStatus: 'All',
      contractType: 'Contract Type',
      allContractTypes: 'All',
      economic: 'Economic',
      principal: 'Principal',
      createdBy: 'Created By',
      allUsers: 'All',
      refresh: 'Refresh',
      clearFilters: 'Clear Filters'
    },
    table: {
      title: 'Import Orders List',
      totalOrders: 'Total orders',
      orderId: 'Order ID',
      supplier: 'Supplier',
      status: 'Status',
      createdBy: 'Created By',
      createdDate: 'Created Date',
      totalAmount: 'Total Amount',
      actions: 'Actions',
      noOrders: 'No orders found',
      loadingOrders: 'Loading orders...',
      locked: 'LOCKED'
    },
    actions: {
      approve: 'Approve',
      reject: 'Reject',
      viewDetails: 'View Details'
    },
    details: {
      title: 'Import Order Details',
      basicInfo: 'Basic Information',
      orderId: 'Order ID',
      contract: 'Contract',
      contractType: 'Contract Type',
      status: 'Status',
      totalAmount: 'Total Amount',
      activeAnnexes: 'Active Annexes',
      importOrderItems: 'Import Order Items',
      activeContractItems: 'Active Contract Items (Including Annexes)',
      medicine: 'Medicine',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      source: 'Source',
      contractSource: 'CONTRACT',
      annexSource: 'ANNEX',
      noContractMedicines: 'No active contract medicines found',
      loadingContractMedicines: 'Loading contract medicines...',
      activeAnnexesInfo: 'Active Annexes Information',
      annex: 'Annex',
      signed: 'Signed',
      added: 'Added',
      removed: 'Removed',
      updated: 'Updated',
      medicines: 'medicines',
      prices: 'prices',
      close: 'Close'
    },
    messages: {
      statusUpdateSuccess: 'Order status updated to',
      failedToFetch: 'Failed to fetch orders',
      requestTimeout: 'Request timeout. Please try again.',
      networkError: 'Network error. Please check your connection.',
      failedToUpdateStatus: 'Failed to update status'
    }
  },

  // Contract Add Dialog
  contractAdd: {
    title: 'Create New Contract',
    subtitle: 'Create new contract with partner',
    generalInfo: 'General Information',
    contractCode: 'Contract Code',
    contractType: 'Contract Type',
    partnerType: 'Partner Type',
    partner: 'Partner',
    validityPeriod: 'Validity Period',
    startDate: 'Start Date',
    endDate: 'End Date',
    medicineList: 'Medicine List',
    addMedicine: 'Add Medicine',
    medicine: 'Medicine',
    quantity: 'Quantity',
    unitPrice: 'Unit Price (VND)',
    annexes: 'Annexes (Optional)',
    addAnnex: 'Add Annex',
    annexCode: 'Annex Code',
    description: 'Description',
    signedDate: 'Signed Date',
    updateEndDate: 'Update End Date',
    addNewMedicine: 'Add New Medicine',
    removeMedicine: 'Remove Medicine',
    updateMedicinePrice: 'Update Medicine Price',
    updateContractEndDate: 'Update Contract End Date',
    annexDescription: 'Annexes allow you to add/remove medicines, update prices or contract terms after the contract is activated.',
    selectPartner: 'Select Partner',
    supplier: 'Supplier',
    retailer: 'Retailer',
    selectSupplier: 'Select Supplier',
    selectRetailer: 'Select Retailer',
    selectMedicine: 'Select Medicine',
    enterQuantity: 'Enter quantity',
    enterUnitPrice: 'Enter unit price',
    enterAnnexCode: 'e.g., PL001',
    enterDescription: 'Detailed description of this annex...',
    selectSignedDate: 'Select signed date',
    selectNewEndDate: 'Select new end date',
    addMedicineToAnnex: 'Add Medicine',
    removeMedicineFromAnnex: 'Add medicine to remove',
    updateMedicinePriceInAnnex: 'Add medicine to update price',
    newPrice: 'New Price',
    cancel: 'Cancel',
    createContract: 'Create Contract',
    creating: 'Creating...',
    validation: {
      partnerRequired: 'Please select a partner',
      medicineRequired: 'Please select a medicine',
      quantityRequiredEconomic: 'Quantity is required for economic contracts',
      quantityInteger: 'Quantity must be a positive integer',
      quantityNotAllowedPrincipal: 'Quantity is not allowed for principal contracts',
      unitPriceRequired: 'Unit price is required',
      unitPriceNonNegative: 'Unit price must be a non-negative number',
      annexCodeRequired: 'Annex code is required',
      signedDateRequired: 'Signed date is required'
    },
    actions: {
      delete: 'Delete'
    }
  }
};
