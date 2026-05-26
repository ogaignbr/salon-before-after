// This page is no longer used (replaced by ComparePage)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PreviewPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/capture', { replace: true });
  }, [navigate]);
  return null;
}
