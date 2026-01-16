import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('Phase 6: Empty State Component', () => {
  const mockAddManually = vi.fn();
  const mockConnectEmail = vi.fn();

  beforeEach(() => {
    mockAddManually.mockClear();
    mockConnectEmail.mockClear();
  });

  it('should render empty state with heading', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText('No Applications Yet')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText(/Start tracking your job applications/)).toBeInTheDocument();
  });

  it('should render "Add Application Manually" button', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText('Add Application Manually')).toBeInTheDocument();
  });

  it('should call onAddManually when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    const addButton = screen.getByText('Add Application Manually');
    await user.click(addButton);
    
    expect(mockAddManually).toHaveBeenCalledTimes(1);
  });

  it('should render "Connect Gmail" button when onConnectEmail is provided', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText('Connect Gmail')).toBeInTheDocument();
  });

  it('should call onConnectEmail when Connect Gmail button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    const connectButton = screen.getByText('Connect Gmail');
    await user.click(connectButton);
    
    expect(mockConnectEmail).toHaveBeenCalledTimes(1);
  });

  it('should not render "Connect Gmail" button when onConnectEmail is not provided', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
      />
    );
    
    expect(screen.queryByText('Connect Gmail')).not.toBeInTheDocument();
  });

  it('should render feature icons', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    // Check for folder_open icon (main empty state icon)
    const icons = document.querySelectorAll('.material-symbols-outlined');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render features section', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText('Organize')).toBeInTheDocument();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
    expect(screen.getByText('Auto-Sync')).toBeInTheDocument();
  });

  it('should render feature descriptions', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText('All in one place')).toBeInTheDocument();
    expect(screen.getByText('Monitor status')).toBeInTheDocument();
    expect(screen.getByText('Import from email')).toBeInTheDocument();
  });

  it('should render Track Your Applications heading', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    expect(screen.getByText('Track Your Applications')).toBeInTheDocument();
  });

  it('should have proper button hierarchy', () => {
    render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    const addButton = screen.getByText('Add Application Manually').closest('button');
    const connectButton = screen.getByText('Connect Gmail').closest('button');
    
    // Add button should have primary styling (bg-primary)
    expect(addButton?.className).toContain('bg-primary');
    
    // Connect button should have secondary styling
    expect(connectButton?.className).toContain('bg-slate-100');
  });

  it('should center content vertically and horizontally', () => {
    const { container } = render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('flex');
    expect(mainDiv.className).toContain('items-center');
    expect(mainDiv.className).toContain('justify-center');
  });

  it('should have minimum height for proper display', () => {
    const { container } = render(
      <EmptyState 
        onAddManually={mockAddManually} 
        onConnectEmail={mockConnectEmail} 
      />
    );
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('min-h-[500px]');
  });
});
