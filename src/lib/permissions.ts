export interface PermissionDefinition {
  id: string
  label: string
  description: string
  category: 'Reservations' | 'Fleet' | 'Customers' | 'Payments' | 'Reports' | 'Administration'
}

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  // Reservations
  {
    id: 'bookings.create',
    label: 'Create & Assign Bookings',
    description: 'Can assign vehicles to customers and initiate new rentals',
    category: 'Reservations',
  },
  {
    id: 'bookings.view',
    label: 'View Rentals & History',
    description: 'Can view active, completed, and past rental bookings',
    category: 'Reservations',
  },
  {
    id: 'bookings.cancel',
    label: 'Cancel Bookings',
    description: 'Can cancel or terminate existing customer bookings',
    category: 'Reservations',
  },

  // Fleet
  {
    id: 'vehicles.view',
    label: 'View Fleet & Cars',
    description: 'Can view vehicle inventory, status, and odometer details',
    category: 'Fleet',
  },
  {
    id: 'vehicles.manage',
    label: 'Add & Edit Vehicles',
    description: 'Can register new cars, edit pricing rates, and update vehicle data',
    category: 'Fleet',
  },
  {
    id: 'vehicles.delete',
    label: 'Delete Fleet Vehicles',
    description: 'Can delete or archive vehicles from the fleet inventory',
    category: 'Fleet',
  },

  // Customers
  {
    id: 'customers.view',
    label: 'View Customer Directory',
    description: 'Can view customer profiles, phone numbers, and addresses',
    category: 'Customers',
  },
  {
    id: 'customers.manage',
    label: 'Create & Manage Customers',
    description: 'Can register new customers, upload KYC, and edit contact info',
    category: 'Customers',
  },
  {
    id: 'customers.delete',
    label: 'Delete Customers',
    description: 'Can permanently remove customer accounts and KYC documents',
    category: 'Customers',
  },

  // Payments
  {
    id: 'payments.view',
    label: 'View Payment Transactions',
    description: 'Can view payment ledger, receipts, and advance deposits',
    category: 'Payments',
  },
  {
    id: 'payments.collect',
    label: 'Collect & Record Payments',
    description: 'Can accept cash/UPI payments, record deposits, and settle invoices',
    category: 'Payments',
  },

  // Reports
  {
    id: 'reports.view',
    label: 'View Reports & Analytics',
    description: 'Can access business reports, revenue summaries, and vehicle utilization',
    category: 'Reports',
  },
  {
    id: 'reports.revenue',
    label: 'Revenue (Last 30 days)',
    description: 'Can view gross revenue figures, 30-day earnings chart, and turnover metrics',
    category: 'Reports',
  },
  {
    id: 'reports.export',
    label: 'Export Reports (Excel / CSV / PDF)',
    description: 'Can download revenue data into Excel, CSV, and print invoices',
    category: 'Reports',
  },

  // Administration
  {
    id: 'team.manage',
    label: 'Manage Staff & Roles',
    description: 'Can create new team accounts and customize manager access permissions',
    category: 'Administration',
  },
  {
    id: 'settings.manage',
    label: 'System & Branch Settings',
    description: 'Can modify company settings, branches, and rate policies',
    category: 'Administration',
  },
]

export const ROLE_PRESETS: Record<
  string,
  { label: string; defaultPermissions: string[] }
> = {
  branch_manager: {
    label: 'Branch Manager',
    defaultPermissions: [
      'bookings.create',
      'bookings.view',
      'bookings.cancel',
      'vehicles.view',
      'vehicles.manage',
      'customers.view',
      'customers.manage',
      'payments.view',
      'payments.collect',
      'reports.view',
      'reports.revenue',
    ],
  },
  booking_manager: {
    label: 'Booking Agent / Dispatcher',
    defaultPermissions: [
      'bookings.create',
      'bookings.view',
      'vehicles.view',
      'customers.view',
      'customers.manage',
      'payments.collect',
    ],
  },
  accountant: {
    label: 'Accountant',
    defaultPermissions: [
      'bookings.view',
      'payments.view',
      'payments.collect',
      'reports.view',
      'reports.revenue',
      'reports.export',
    ],
  },
  vehicle_manager: {
    label: 'Fleet Supervisor',
    defaultPermissions: [
      'vehicles.view',
      'vehicles.manage',
      'bookings.view',
    ],
  },
  staff: {
    label: 'Staff',
    defaultPermissions: [
      'bookings.create',
      'bookings.view',
      'vehicles.view',
      'customers.view',
    ],
  },
  admin: {
    label: 'Administrator',
    defaultPermissions: AVAILABLE_PERMISSIONS.map(p => p.id),
  },
}
