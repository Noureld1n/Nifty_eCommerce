export const CUSTOMER_LINKS = {
  primary: [
    { to: '/shop', label: 'Shop', end: true, icon: 'shop' },
    { to: '/account/wishlist', label: 'Wishlist', icon: 'wishlist' },
    { to: '/account/orders', label: 'Orders', icon: 'orders' },
  ],
  menus: [
    {
      label: 'Account',
      items: [
        { to: '/account/profile', label: 'Profile' },
        { to: '/account/addresses', label: 'Addresses' },
        { to: '/account/payments', label: 'Payment methods' },
        { to: '/account/security', label: 'Security' },
        { to: '/account/feedback', label: 'Feedback' },
      ],
    },
  ],
}

export const ADMIN_LINKS = {
  primary: [
    { to: '/shop', label: 'Shop', end: true, icon: 'shop' },
    { to: '/admin/analytics', label: 'Overview' },
    { to: '/admin/catalog', label: 'Catalog' },
    { to: '/admin/orders', label: 'Orders' },
  ],
  menus: [
    {
      label: 'Commerce',
      items: [
        { to: '/admin/promotions', label: 'Promotions' },
        { to: '/admin/procurement', label: 'Procurement & stock' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/feedback', label: 'Customer feedback' },
        { to: '/admin/audit-log', label: 'Audit log' },
      ],
    },
  ],
}
