import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classService } from '@/services/api/classService';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import ApperIcon from '@/components/ApperIcon';

const ClassForm = ({ classData, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    subject: classData?.subject || '',
    period: classData?.period || '1st Period',
    startTime: classData?.startTime || '08:00',
    endTime: classData?.endTime || '08:50',
    room: classData?.room || '',
    color: classData?.color || 'primary'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Class name is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.room.trim()) newErrors.room = 'Room number is required';
    
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.startTime)) newErrors.startTime = 'Invalid time format';
    if (!timeRegex.test(formData.endTime)) newErrors.endTime = 'Invalid time format';
    
    // Validate end time is after start time
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isEdit) {
        await classService.update(classData.Id, formData);
        toast.success('Class updated successfully');
      } else {
        await classService.create(formData);
        toast.success('Class created successfully');
      }
      onSubmit();
    } catch (error) {
      toast.error(isEdit ? 'Failed to update class' : 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const periodOptions = [
    '1st Period', '2nd Period', '3rd Period', '4th Period',
    '5th Period', '6th Period', '7th Period', '8th Period'
  ];

  const colorOptions = [
    { value: 'primary', label: 'Blue', class: 'bg-primary-500' },
    { value: 'accent', label: 'Cyan', class: 'bg-accent-500' },
    { value: 'success', label: 'Green', class: 'bg-success-500' },
    { value: 'warning', label: 'Yellow', class: 'bg-warning-500' },
    { value: 'error', label: 'Red', class: 'bg-error-500' }
  ];

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Class Name" error={errors.name} required>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Algebra II, World History"
            className={errors.name ? 'border-error-300' : ''}
          />
        </FormField>

        <FormField label="Subject" error={errors.subject} required>
          <Input
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="e.g., Mathematics, Science"
            className={errors.subject ? 'border-error-300' : ''}
          />
        </FormField>

        <FormField label="Period" error={errors.period}>
          <select
            value={formData.period}
            onChange={(e) => handleChange('period', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {periodOptions.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Room" error={errors.room} required>
          <Input
            value={formData.room}
            onChange={(e) => handleChange('room', e.target.value)}
            placeholder="e.g., Room 201, Lab 302"
            className={errors.room ? 'border-error-300' : ''}
          />
        </FormField>

        <FormField label="Start Time" error={errors.startTime}>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            className={errors.startTime ? 'border-error-300' : ''}
          />
        </FormField>

        <FormField label="End Time" error={errors.endTime}>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            className={errors.endTime ? 'border-error-300' : ''}
          />
        </FormField>
      </div>

      <FormField label="Theme Color">
        <div className="flex gap-3">
          {colorOptions.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleChange('color', color.value)}
              className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                formData.color === color.value ? 'border-slate-800' : 'border-slate-300'
              } hover:scale-110 transition-transform`}
              title={color.label}
            />
          ))}
        </div>
      </FormField>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2"
        >
          {loading && <ApperIcon name="Loader2" className="h-4 w-4 animate-spin" />}
          <span>{isEdit ? 'Update Class' : 'Create Class'}</span>
        </Button>
      </div>
    </motion.form>
  );
};

export default ClassForm;