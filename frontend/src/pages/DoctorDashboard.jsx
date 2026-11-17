const handleSaveBlackout = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      alert('Start Date and End Date are required.');
      return;
    }

    // Clean payload: convert empty strings to null/undefined so backend doesn't crash on time validation
    const payload = {
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: formData.start_time ? formData.start_time : null,
      end_time: formData.end_time ? formData.end_time : null,
      category: formData.category,
      note: formData.note ? formData.note : null
    };

    setSubmittingBlackout(true);
    try {
      if (editingBlackout) {
        await api.put(`/blackouts/${editingBlackout.id}`, payload);
      } else {
        await api.post('/api/blackouts', payload); // Check if your axios base URL already includes '/api'
      }
      setIsModalOpen(false);
      fetchBlackouts();
    } catch (err) {
      // Log the exact error message from backend for deeper inspection
      console.error("Server validation error:", err.response?.data);
      alert(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to save blackout period.');
    } finally {
      setSubmittingBlackout(false);
    }
  };