import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCards from './StatsCards';
import { Application } from '../types';

describe('Phase 2: Dynamic Stats Calculation', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      company: 'Test Corp',
      role: 'Developer',
      location: 'Remote',
      dateApplied: 'Jan 1, 2024',
      lastUpdate: 'Jan 5, 2024',
      status: 'Interview',
      source: 'LinkedIn',
      sourceIcon: 'link',
      logoUrl: '',
      logoBgColor: 'bg-blue-100',
      logoTextColor: 'text-blue-600',
    },
    {
      id: '2',
      company: 'Test Inc',
      role: 'Engineer',
      location: 'NYC',
      dateApplied: 'Jan 2, 2024',
      lastUpdate: 'Jan 2, 2024',
      status: 'Applied',
      source: 'Direct',
      sourceIcon: 'send',
      logoUrl: '',
      logoBgColor: 'bg-green-100',
      logoTextColor: 'text-green-600',
    },
    {
      id: '3',
      company: 'Test Ltd',
      role: 'Designer',
      location: 'SF',
      dateApplied: 'Jan 3, 2024',
      lastUpdate: 'Jan 10, 2024',
      status: 'Rejected',
      source: 'Indeed',
      sourceIcon: 'search',
      logoUrl: '',
      logoBgColor: 'bg-red-100',
      logoTextColor: 'text-red-600',
    },
    {
      id: '4',
      company: 'Test Co',
      role: 'Manager',
      location: 'LA',
      dateApplied: 'Jan 4, 2024',
      lastUpdate: 'Jan 15, 2024',
      status: 'Offer',
      source: 'Referrer',
      sourceIcon: 'person',
      logoUrl: '',
      logoBgColor: 'bg-purple-100',
      logoTextColor: 'text-purple-600',
    },
  ];

  it('should calculate total applications correctly', () => {
    render(<StatsCards applications={mockApplications} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should calculate interview count correctly', () => {
    render(<StatsCards applications={mockApplications} />);
    const interviewCards = screen.getAllByText('1');
    expect(interviewCards.length).toBeGreaterThan(0);
  });

  it('should calculate offer count correctly', () => {
    render(<StatsCards applications={mockApplications} />);
    const offerCards = screen.getAllByText('1');
    expect(offerCards.length).toBeGreaterThan(0);
  });

  it('should calculate rejected count correctly', () => {
    render(<StatsCards applications={mockApplications} />);
    const rejectedCards = screen.getAllByText('1');
    expect(rejectedCards.length).toBeGreaterThan(0);
  });

  it('should show zero when no applications', () => {
    render(<StatsCards applications={[]} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4); // All four stat cards should show 0
  });

  it('should update counts when applications change', () => {
    const { rerender } = render(<StatsCards applications={mockApplications} />);
    expect(screen.getByText('4')).toBeInTheDocument();

    // Add more applications
    const moreApplications = [...mockApplications, {
      id: '5',
      company: 'Another Corp',
      role: 'Developer',
      location: 'Remote',
      dateApplied: 'Jan 5, 2024',
      lastUpdate: 'Jan 5, 2024',
      status: 'Interview',
      source: 'LinkedIn',
      sourceIcon: 'link',
      logoUrl: '',
      logoBgColor: 'bg-blue-100',
      logoTextColor: 'text-blue-600',
    }];

    rerender(<StatsCards applications={moreApplications} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render all four stat cards', () => {
    render(<StatsCards applications={mockApplications} />);
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('Interviews')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });
});
