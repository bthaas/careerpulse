export type AppStatus = 'Interview' | 'Applied' | 'Rejected' | 'Offer';

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  dateApplied: string;
  lastUpdate: string;
  status: AppStatus;
  source: string;
  sourceIcon: string;
  logoUrl: string;
  logoBgColor: string;
  logoTextColor: string;
  salary?: string;
  remotePolicy?: string;
  emailSubject?: string;
  emailBody?: string;
  notes?: string;
  createdAt?: string;
}

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    company: 'Acme Corp',
    role: 'Senior Designer',
    location: 'San Francisco, CA',
    dateApplied: 'Oct 24, 2023',
    lastUpdate: 'Jan 14, 2026',
    status: 'Interview',
    source: 'LinkedIn',
    sourceIcon: 'link',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOHpIMTDlsn1d296R_3XU_62zTItoEnIsNWSsKkdHLBGBI2gWH4dijamHaAL6Ri1igtchpx1sYuwQxlWraggSXiz-2Ilqwozc2dZJKmZXFaBYEcwHgOAUcl4Utm_J0vdZHAHotAMe5BN7ZPrzZwQBjpWXLASEiFEcz8N1vtMlVRU93zkccCZpLCYayyxBR-9ZBvIAgCf5Yixlwb0x-Rk9Op7Fr6tKDgiIUPqwOnGSm4twzU8v5mCmmuZsEr51dG0NKNl4Y7WOEAuqS',
    logoBgColor: 'bg-indigo-100',
    logoTextColor: 'text-indigo-600',
    salary: '$140k - $165k',
    remotePolicy: 'On-site',
    emailSubject: 'Interview Invitation - Acme Corp',
    emailBody: `Hi Applicant,\n\nWe were impressed by your portfolio and would like to invite you to a virtual onsite interview next week.`,
    notes: 'Prepare portfolio review presentation.'
  },
  {
    id: '2',
    company: 'TechFlow',
    role: 'Frontend Dev',
    location: 'Remote',
    dateApplied: 'Oct 22, 2023',
    lastUpdate: 'Oct 22, 2023',
    status: 'Applied',
    source: 'Referrer',
    sourceIcon: 'person',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmZ5f5PjJVpCeXDbGaAwURRzBP9PXcnzwjQLwQgOtNtPdnTHhW8bbk3JLbNV0OAKGAec3qEK7LGuCMVdAL20PgYkTMF3WDnN-KQgpLRm6QcJ1nfYz5c1wKPNhjWp7Fg2KsoZ75cLN7w0nJl1WPjCRcg7FDBhJDaw7ansNvXRH1mE451iVBj6r-7Mz3JI_MbFqqXhjv-XXCeikNfEMVLlwyGrEJv_aZON5KDci589yjredWj6mkkXtGzItx-Hyb4TSOnLAl1Z7WTqgE',
    logoBgColor: 'bg-blue-100',
    logoTextColor: 'text-blue-600',
    salary: '$120k - $150k',
    remotePolicy: 'Remote',
    emailSubject: 'Application Received',
    emailBody: `Thanks for applying to TechFlow. We will review your application shortly.`,
    notes: 'Referral from Mike T.'
  },
  {
    id: '3',
    company: 'Innovate Inc',
    role: 'Product Manager',
    location: 'New York, NY',
    dateApplied: 'Oct 20, 2023',
    lastUpdate: 'Nov 5, 2023',
    status: 'Rejected',
    source: 'Indeed',
    sourceIcon: 'public',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_SsTaaervnIZfzaiFWWxDdWC4VShFh1ok8cKKVBCN0h7eqrA0_0tGONOML42HR-h8kTbjhCnI96oQ0FIaLnF6KGQBGECS0QXu-O6OVh-FYRDzXdUHtw1paDz-xoxS2zTw-aHkdLn26WfvILdcvqkqG_mCcLD9sIrl6ehy2RJ4Dx7GjKdnUXi2bKmpvs-CKaJPctWOHm6gqgk5plGNCfl_HT-yMky-OUfy0VNVl6t7Ef1U4WPHiflGVqi4jJJqIzTAJuIfg-Fkinm8',
    logoBgColor: 'bg-purple-100',
    logoTextColor: 'text-purple-600',
    salary: '$160k - $190k',
    remotePolicy: 'Hybrid',
    emailSubject: 'Update on your application',
    emailBody: `Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.`,
    notes: 'Reapply in 6 months.'
  },
  {
    id: '4',
    company: 'Globex Corp',
    role: 'UX Researcher',
    location: 'Austin, TX',
    dateApplied: 'Oct 18, 2023',
    lastUpdate: 'Oct 18, 2023',
    status: 'Applied',
    source: 'Glassdoor',
    sourceIcon: 'search',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd6Qph4cDD66f6Sj3PZK-gnbH8EhE74cQD8YiovOGMra7IoS6s81m1ZJyS92L8NFZ4en0d65ykweV7HfdBoambZyzpWiVLnfW7truvhFcj7_tJTjW41YsTcTMDRmEYG-I54NnwJdTykapEckhxu3UtnacGYUxXoRJlbk6b_Zr9yhIOFCo4qG--ow_YPVWWv1mY7O1AtUZ9KyporUQdQZPelMZsib-7VwKYcq_DYQUcpPG3tdgTUO_34inGCDAUOcSLwj4rYg4Qg2on',
    logoBgColor: 'bg-emerald-100',
    logoTextColor: 'text-emerald-600',
    salary: '$110k - $130k',
    remotePolicy: 'Hybrid',
    emailSubject: 'Application Confirmation',
    emailBody: `We have received your application for UX Researcher.`,
    notes: 'Known for good work-life balance.'
  },
  {
    id: '5',
    company: 'DataSystems',
    role: 'Data Scientist',
    location: 'Seattle, WA',
    dateApplied: 'Oct 15, 2023',
    lastUpdate: 'Dec 10, 2023',
    status: 'Offer',
    source: 'Direct',
    sourceIcon: 'send',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVHwbJ8UuyauTcEZPjglHX2Zho4GIP1iZSnecB0xiYiH8OGbASHDjiDXpaZI1e_xETYsUHgeMj-vaZGpUPWV2sulEk8tjr5FfKsUJtuzxj1V8iMI4-T3ZGcVW12O8hql_a6LjCXNsV7dQkNV0yX6t0jYRnSeWrBe76NclPmGIXqdnW-IcDMC2_us1yvmDcwabXjoTJrjDohA_MJ9wTSGz7MufDylxzkR9wfBrjSr885srFbyXyR5tTxNsrbWILba1INGQYPjEhxRkx',
    logoBgColor: 'bg-cyan-100',
    logoTextColor: 'text-cyan-600',
    salary: '$170k - $200k',
    remotePolicy: 'Remote',
    emailSubject: 'Offer Letter',
    emailBody: `We are pleased to offer you the position of Data Scientist!`,
    notes: 'Negotiate signing bonus.'
  },
  {
    id: '6', // Example for the drawer view matching the screenshot
    company: 'Google',
    role: 'Software Engineer, Full Stack',
    location: 'Mountain View, CA',
    dateApplied: 'Oct 24, 2023',
    lastUpdate: 'Jan 15, 2026',
    status: 'Applied', // Using Applied technically but "In Review" is a substatus in the UI
    source: 'LinkedIn',
    sourceIcon: 'work',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUgS-Yt9gs0vGBEhlKlB9a9fRM8XWhKyin6qzn2iQxWj8h6PBXVCs_nkuzmDkNKUFLlwWEXW4LWZsO9cF1VBC2tgkWZv4mL4zglgeanNBG4gUUuhX-q8s3th0aSsWU-x2Gj8Ko1cGnJwLdkzSbZbSW1S0xiBuACIvOcgP6Ne_9LNwta6vDgWblghQTKHh7KwEsgpZWTuHQSiRxn13uR1avnJPNENmCK0QYfWCgmbSeF01ibtFd_Fe-CaWSWKDQGWoXlKKCP2gBgRvK',
    logoBgColor: 'bg-white',
    logoTextColor: 'text-slate-900',
    salary: '$150k - $180k',
    remotePolicy: 'Hybrid (3 days)',
    emailSubject: 'Thank you for applying to Google!',
    emailBody: `Hi Applicant,\n\nThanks for your interest in the Software Engineer, Full Stack position at Google. We've received your application and will review it shortly.\n\nWhile we're unable to reach out to every applicant, our recruiting team will contact you if your skills and experience are a strong match for the role. In the meantime, you can check the status of your application by logging into your candidate profile.\n\nThank you again for considering a career at Google.\n\nBest regards,\nGoogle Staffing Team`,
    notes: 'Referred by Sarah J.\n\nNeed to brush up on System Design for the onsite round. They mentioned a focus on distributed caching.\n\nFollow up scheduled for next Tuesday if I don\'t hear back.'
  }
];