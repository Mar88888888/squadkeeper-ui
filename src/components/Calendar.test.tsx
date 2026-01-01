import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar, CalendarEvent } from './Calendar';

describe('Calendar', () => {
  const mockEvents: CalendarEvent[] = [
    {
      id: 'e1',
      type: 'training',
      title: 'Training Session',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
      group: 'U12',
    },
    {
      id: 'e2',
      type: 'match',
      title: 'Match vs Team B',
      startTime: '2024-01-20T15:00:00Z',
      endTime: '2024-01-20T17:00:00Z',
      group: 'U12',
    },
  ];

  const defaultProps = {
    year: 2024,
    month: 0, // January
    events: mockEvents,
    onEventClick: jest.fn(),
    onPrevMonth: jest.fn(),
    onNextMonth: jest.fn(),
    onToday: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the calendar with correct month and year', () => {
    render(<Calendar {...defaultProps} />);

    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('should render weekday headers', () => {
    render(<Calendar {...defaultProps} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('should render all days of the month', () => {
    render(<Calendar {...defaultProps} />);

    // January 2024 has 31 days
    for (let i = 1; i <= 31; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('should call onPrevMonth when previous button is clicked', () => {
    render(<Calendar {...defaultProps} />);

    const prevButton = screen.getByLabelText('Previous month');
    fireEvent.click(prevButton);

    expect(defaultProps.onPrevMonth).toHaveBeenCalledTimes(1);
  });

  it('should call onNextMonth when next button is clicked', () => {
    render(<Calendar {...defaultProps} />);

    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);

    expect(defaultProps.onNextMonth).toHaveBeenCalledTimes(1);
  });

  it('should show Today button when not on current month', () => {
    render(<Calendar {...defaultProps} year={2023} month={5} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('should call onToday when Today button is clicked', () => {
    render(<Calendar {...defaultProps} year={2023} month={5} />);

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    expect(defaultProps.onToday).toHaveBeenCalledTimes(1);
  });

  it('should render training events with correct styling', () => {
    render(<Calendar {...defaultProps} />);

    const trainingEvent = screen.getByText(/Training Session/);
    expect(trainingEvent).toBeInTheDocument();
    expect(trainingEvent).toHaveClass('bg-emerald-500');
  });

  it('should render match events with correct styling', () => {
    render(<Calendar {...defaultProps} />);

    const matchEvent = screen.getByText(/Match vs Team B/);
    expect(matchEvent).toBeInTheDocument();
    expect(matchEvent).toHaveClass('bg-blue-500');
  });

  it('should call onEventClick when an event is clicked', () => {
    render(<Calendar {...defaultProps} />);

    const trainingEvent = screen.getByText(/Training Session/);
    fireEvent.click(trainingEvent);

    expect(defaultProps.onEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('should display +N more when there are more than 2 events on a day', () => {
    const manyEvents: CalendarEvent[] = [
      { id: '1', type: 'training', title: 'Event 1', startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T10:00:00Z', group: 'U12' },
      { id: '2', type: 'training', title: 'Event 2', startTime: '2024-01-15T11:00:00Z', endTime: '2024-01-15T12:00:00Z', group: 'U12' },
      { id: '3', type: 'match', title: 'Event 3', startTime: '2024-01-15T14:00:00Z', endTime: '2024-01-15T15:00:00Z', group: 'U12' },
      { id: '4', type: 'training', title: 'Event 4', startTime: '2024-01-15T16:00:00Z', endTime: '2024-01-15T17:00:00Z', group: 'U12' },
    ];

    render(<Calendar {...defaultProps} events={manyEvents} />);

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should render legend items', () => {
    render(<Calendar {...defaultProps} />);

    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Match')).toBeInTheDocument();
  });

  it('should handle empty events array', () => {
    render(<Calendar {...defaultProps} events={[]} />);

    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.queryByText(/Training Session/)).not.toBeInTheDocument();
  });

  it('should sort events by time on the same day', () => {
    const unsortedEvents: CalendarEvent[] = [
      { id: '1', type: 'training', title: 'Later Event', startTime: '2024-01-15T15:00:00Z', endTime: '2024-01-15T16:00:00Z', group: 'U12' },
      { id: '2', type: 'match', title: 'Earlier Event', startTime: '2024-01-15T09:00:00Z', endTime: '2024-01-15T10:00:00Z', group: 'U12' },
    ];

    render(<Calendar {...defaultProps} events={unsortedEvents} />);

    // The calendar should render events sorted by start time
    const eventButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('Earlier Event') || btn.textContent?.includes('Later Event')
    );

    // First button should be Earlier Event (09:00)
    expect(eventButtons[0].textContent).toContain('Earlier');
  });

  it('should render different months correctly', () => {
    const { rerender } = render(<Calendar {...defaultProps} month={11} />);
    expect(screen.getByText('December 2024')).toBeInTheDocument();

    rerender(<Calendar {...defaultProps} month={6} />);
    expect(screen.getByText('July 2024')).toBeInTheDocument();
  });
});
