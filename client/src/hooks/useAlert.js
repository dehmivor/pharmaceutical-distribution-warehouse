// hooks/useAlert.js
import { useState } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showAlert = (message, severity = 'success') => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  return {
    alert,
    showAlert,
    hideAlert
  };
}
