import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Phase 5: Sort and Filter Functionality', () => {
  it('should render the application with table', () => {
    render(<App />);
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
  });

  it('should display sort button', () => {
    render(<App />);
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('should display filter button', () => {
    render(<App />);
    const filterButtons = screen.getAllByText('Filter');
    expect(filterButtons.length).toBeGreaterThan(0);
  });

  it('should open sort menu when sort button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const sortButton = screen.getByText('Sort');
    await user.click(sortButton);
    
    // Check for sort menu options (will have duplicates with table headers)
    const companyOptions = screen.getAllByText(/Company/);
    expect(companyOptions.length).toBeGreaterThan(1); // Sort option + table header
  });

  it('should open filter menu when filter button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const filterButtons = screen.getAllByText('Filter');
    await user.click(filterButtons[0]);
    
    // Check for filter menu options
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
    
    // Check for checkboxes (filter options)
    expect(screen.getByRole('checkbox', { name: /Applied/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Interview/i })).toBeInTheDocument();
  });

  it('should filter applications by status', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open filter menu
    const filterButtons = screen.getAllByText('Filter');
    await user.click(filterButtons[0]);
    
    // Check "Interview" status
    const interviewCheckbox = screen.getByRole('checkbox', { name: /Interview/i });
    await user.click(interviewCheckbox);
    
    // Apply filter
    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);
    
    // Filter indicator should show
    const filterButton = screen.getAllByText('Filter')[0];
    expect(filterButton.parentElement?.textContent).toContain('1');
  });

  it('should filter by date range', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open filter menu
    const filterButtons = screen.getAllByText('Filter');
    await user.click(filterButtons[0]);
    
    // Select "Last 30 Days"
    const last30DaysRadio = screen.getByRole('radio', { name: /Last 30 Days/i });
    await user.click(last30DaysRadio);
    
    // Apply filter
    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);
    
    // Filter indicator should show
    const filterButton = screen.getAllByText('Filter')[0];
    expect(filterButton.parentElement?.textContent).toContain('1');
  });

  it('should clear all filters', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open filter menu
    const filterButtons = screen.getAllByText('Filter');
    await user.click(filterButtons[0]);
    
    // Check a status
    const interviewCheckbox = screen.getByRole('checkbox', { name: /Interview/i });
    await user.click(interviewCheckbox);
    
    // Clear filters
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    // Filter should be cleared (no indicator)
    const filterButton = screen.getAllByText('Filter')[0];
    expect(filterButton.parentElement?.querySelector('.bg-primary')).not.toBeInTheDocument();
  });

  it('should sort applications by company name', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open sort menu
    const sortButton = screen.getByText('Sort');
    await user.click(sortButton);
    
    // Click Company sort (find the button within sort menu)
    const companySortOptions = screen.getAllByText(/Company/);
    // The first one should be in the sort menu (button)
    const sortMenuButtons = companySortOptions.filter(el => el.tagName === 'SPAN');
    await user.click(sortMenuButtons[0].closest('button')!);
    
    // Sort indicator should show
    const sortButtonAfter = screen.getByText('Sort');
    expect(sortButtonAfter.parentElement?.textContent).toContain('1');
  });

  it('should toggle sort order when clicking same sort field', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Sort by company first time (asc)
    let sortButton = screen.getByText('Sort');
    await user.click(sortButton);
    
    let companySortOptions = screen.getAllByText(/Company/);
    let sortMenuButton = companySortOptions.find(el => el.closest('button')?.textContent?.includes('Company'));
    await user.click(sortMenuButton!.closest('button')!);
    
    // Verify sort is active
    sortButton = screen.getByText('Sort');
    expect(sortButton.parentElement?.textContent).toContain('1');
    
    // Sort by company second time (toggles order)
    await user.click(sortButton);
    companySortOptions = screen.getAllByText(/Company/);
    sortMenuButton = companySortOptions.find(el => el.closest('button')?.textContent?.includes('Company'));
    await user.click(sortMenuButton!.closest('button')!);
    
    // Sort should still be active (just order changed)
    sortButton = screen.getByText('Sort');
    expect(sortButton.parentElement?.textContent).toContain('1');
  });

  it('should show active filter count', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open filter menu
    const filterButtons = screen.getAllByText('Filter');
    await user.click(filterButtons[0]);
    
    // Check two statuses
    await user.click(screen.getByRole('checkbox', { name: /Interview/i }));
    await user.click(screen.getByRole('checkbox', { name: /Applied/i }));
    
    // Apply
    await user.click(screen.getByText('Apply'));
    
    // Should show count of 1 (status filter group counts as 1)
    const filterButton = screen.getAllByText('Filter')[0];
    expect(filterButton.parentElement?.textContent).toContain('1');
  });

  it('should combine status and date filters', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open filter menu
    const filterButtons = screen.getAllByText('Filter');
    await user.click(filterButtons[0]);
    
    // Select status
    await user.click(screen.getByRole('checkbox', { name: /Interview/i }));
    
    // Select date range
    await user.click(screen.getByRole('radio', { name: /Last 30 Days/i }));
    
    // Apply
    await user.click(screen.getByText('Apply'));
    
    // Should show count of 2 (both filters active)
    const filterButton = screen.getAllByText('Filter')[0];
    expect(filterButton.parentElement?.textContent).toContain('2');
  });

  it('should maintain sort when adding new application', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Apply sort
    const sortButton = screen.getByText('Sort');
    await user.click(sortButton);
    
    const companySortOptions = screen.getAllByText(/Company/);
    const sortMenuButton = companySortOptions.find(el => el.closest('button')?.textContent?.includes('Company'));
    await user.click(sortMenuButton!.closest('button')!);
    
    // Open Add Application modal
    const addButton = screen.getByText('Add Application');
    await user.click(addButton);
    
    // Fill and submit
    await user.type(screen.getByPlaceholderText(/e.g., Google, Microsoft/), 'Test Company');
    await user.type(screen.getByPlaceholderText(/e.g., Senior Software Engineer/), 'Test Role');
    await user.type(screen.getByPlaceholderText(/e.g., San Francisco/), 'Test Location');
    await user.click(screen.getByRole('button', { name: 'Add Application' }));
    
    // Sort should still be active
    const sortButtonAfter = screen.getByText('Sort');
    expect(sortButtonAfter.parentElement?.textContent).toContain('1');
  });
});
