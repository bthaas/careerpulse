import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApplicationsTable from './ApplicationsTable';
import { Application } from '../types';

describe('Phase 3: Last Update Column', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      company: 'Acme Corp',
      role: 'Senior Developer',
      location: 'San Francisco, CA',
      dateApplied: 'Oct 24, 2023',
      lastUpdate: 'Jan 14, 2026',
      status: 'Interview',
      source: 'LinkedIn',
      sourceIcon: 'link',
      logoUrl: 'https://example.com/logo.png',
      logoBgColor: 'bg-blue-100',
      logoTextColor: 'text-blue-600',
      salary: '$120k - $150k',
    },
    {
      id: '2',
      company: 'TechFlow',
      role: 'Frontend Dev',
      location: 'Remote',
      dateApplied: 'Oct 22, 2023',
      lastUpdate: 'Oct 22, 2023',
      status: 'Applied',
      source: 'Direct',
      sourceIcon: 'send',
      logoUrl: 'https://example.com/logo2.png',
      logoBgColor: 'bg-green-100',
      logoTextColor: 'text-green-600',
    },
  ];

  const mockSelectApplication = vi.fn();

  it('should render Last Update column header', () => {
    render(
      <ApplicationsTable 
        applications={mockApplications} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    expect(screen.getByText('Last Update')).toBeInTheDocument();
  });

  it('should display lastUpdate value for each application', () => {
    render(
      <ApplicationsTable 
        applications={mockApplications} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    expect(screen.getByText('Jan 14, 2026')).toBeInTheDocument();
    const oct22Dates = screen.getAllByText('Oct 22, 2023');
    expect(oct22Dates.length).toBeGreaterThanOrEqual(2); // Date Applied and Last Update
  });

  it('should render all required columns', () => {
    render(
      <ApplicationsTable 
        applications={mockApplications} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Date Applied')).toBeInTheDocument();
    expect(screen.getByText('Last Update')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('should render application data in correct columns', () => {
    render(
      <ApplicationsTable 
        applications={mockApplications} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    // Check company names
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('TechFlow')).toBeInTheDocument();
    
    // Check roles
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    
    // Check date applied
    expect(screen.getByText('Oct 24, 2023')).toBeInTheDocument();
    const oct22Dates = screen.getAllByText('Oct 22, 2023');
    expect(oct22Dates.length).toBeGreaterThan(0);
  });

  it('should display correct application count in pagination', () => {
    const { container } = render(
      <ApplicationsTable 
        applications={mockApplications} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    // Check pagination text - text is split across spans, so we check the container
    const paginationSection = container.querySelector('.px-6.py-4.border-t');
    expect(paginationSection?.textContent).toContain('Showing');
    expect(paginationSection?.textContent).toContain('1');
    expect(paginationSection?.textContent).toContain('2');
    expect(paginationSection?.textContent).toContain('results');
  });

  it('should render empty table when no applications', () => {
    render(
      <ApplicationsTable 
        applications={[]} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
    expect(screen.getByText('Last Update')).toBeInTheDocument();
  });

  it('should have Last Update column between Date Applied and Status', () => {
    const { container } = render(
      <ApplicationsTable 
        applications={mockApplications} 
        onSelectApplication={mockSelectApplication} 
      />
    );
    
    const headers = container.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(th => th.textContent);
    
    const dateAppliedIndex = headerTexts.indexOf('Date Applied');
    const lastUpdateIndex = headerTexts.indexOf('Last Update');
    const statusIndex = headerTexts.indexOf('Status');
    
    expect(lastUpdateIndex).toBeGreaterThan(dateAppliedIndex);
    expect(statusIndex).toBeGreaterThan(lastUpdateIndex);
  });
});
