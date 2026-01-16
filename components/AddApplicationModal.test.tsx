import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddApplicationModal from './AddApplicationModal';

describe('Phase 4: Add Application Modal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AddApplicationModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    expect(screen.queryByText('Add New Application')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    expect(screen.getByText('Add New Application')).toBeInTheDocument();
  });

  it('should have all required form fields', () => {
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    expect(screen.getByPlaceholderText(/e.g., Google, Microsoft/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., Senior Software Engineer/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., San Francisco/)).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const submitButton = screen.getByText('Add Application');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
      expect(screen.getByText('Job title is required')).toBeInTheDocument();
      expect(screen.getByText('Location is required')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Submit to show errors
    const submitButton = screen.getByText('Add Application');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });
    
    // Start typing in company field
    const companyInput = screen.getByPlaceholderText(/e.g., Google, Microsoft/);
    await user.type(companyInput, 'T');
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Company name is required')).not.toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fill out required fields
    await user.type(screen.getByPlaceholderText(/e.g., Google, Microsoft/), 'Test Company');
    await user.type(screen.getByPlaceholderText(/e.g., Senior Software Engineer/), 'Test Role');
    await user.type(screen.getByPlaceholderText(/e.g., San Francisco/), 'Test Location');
    
    const submitButton = screen.getByText('Add Application');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        company: 'Test Company',
        role: 'Test Role',
        location: 'Test Location',
        status: 'Applied',
        source: 'LinkedIn',
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should include optional fields in submission', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fill out required fields
    await user.type(screen.getByPlaceholderText(/e.g., Google, Microsoft/), 'Test Company');
    await user.type(screen.getByPlaceholderText(/e.g., Senior Software Engineer/), 'Test Role');
    await user.type(screen.getByPlaceholderText(/e.g., San Francisco/), 'Test Location');
    
    // Fill out optional fields
    await user.type(screen.getByPlaceholderText(/e.g., \$120k - \$150k/), '$100k - $120k');
    await user.type(screen.getByPlaceholderText(/e.g., Remote, Hybrid/), 'Remote');
    await user.type(screen.getByPlaceholderText(/Add any additional notes/), 'Test notes');
    
    const submitButton = screen.getByText('Add Application');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        salary: '$100k - $120k',
        remotePolicy: 'Remote',
        notes: 'Test notes',
      }));
    });
  });

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should close modal when close icon is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: 'close' });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have status dropdown with correct options', () => {
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects.find(select => 
      select.querySelector('option[value="Applied"]')
    );
    
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue('Applied'); // Default value
  });

  it('should have source dropdown with correct options', () => {
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const sourceSelects = screen.getAllByRole('combobox');
    const sourceSelect = sourceSelects.find(select => 
      select.querySelector('option[value="LinkedIn"]')
    );
    
    expect(sourceSelect).toBeInTheDocument();
    expect(sourceSelect).toHaveValue('LinkedIn'); // Default value
  });

  it('should change status when dropdown is changed', async () => {
    const user = userEvent.setup();
    render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects.find(select => 
      select.querySelector('option[value="Interview"]')
    );
    
    await user.selectOptions(statusSelect!, 'Interview');
    
    // Fill required fields and submit
    await user.type(screen.getByPlaceholderText(/e.g., Google, Microsoft/), 'Test Company');
    await user.type(screen.getByPlaceholderText(/e.g., Senior Software Engineer/), 'Test Role');
    await user.type(screen.getByPlaceholderText(/e.g., San Francisco/), 'Test Location');
    
    await user.click(screen.getByText('Add Application'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        status: 'Interview',
      }));
    });
  });

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fill and submit
    await user.type(screen.getByPlaceholderText(/e.g., Google, Microsoft/), 'Test Company');
    await user.type(screen.getByPlaceholderText(/e.g., Senior Software Engineer/), 'Test Role');
    await user.type(screen.getByPlaceholderText(/e.g., San Francisco/), 'Test Location');
    await user.click(screen.getByText('Add Application'));
    
    // Reopen modal
    rerender(
      <AddApplicationModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    // Fields should be empty
    const companyInput = screen.getByPlaceholderText(/e.g., Google, Microsoft/) as HTMLInputElement;
    expect(companyInput.value).toBe('');
  });
});
