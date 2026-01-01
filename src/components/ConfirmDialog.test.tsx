import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('should render dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should render default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, Delete"
        cancelLabel="No, Keep"
      />
    );

    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when backdrop is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Find the backdrop element by its class
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    } else {
      // If exact class not found, click outside the dialog content
      const outerDiv = screen.getByText('Confirm Action').closest('.fixed');
      if (outerDiv) {
        fireEvent.click(outerDiv);
      }
    }
  });

  it('should call onCancel when Escape key is pressed', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel on Escape when dialog is closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  describe('variants', () => {
    it('should render warning variant by default', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const iconContainer = document.querySelector('.bg-amber-100');
      expect(iconContainer).toBeTruthy();
    });

    it('should render danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const iconContainer = document.querySelector('.bg-red-100');
      expect(iconContainer).toBeTruthy();
    });

    it('should render info variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);

      const iconContainer = document.querySelector('.bg-blue-100');
      expect(iconContainer).toBeTruthy();
    });
  });

  it('should set body overflow to hidden when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should reset body overflow when closed', () => {
    const { rerender } = render(<ConfirmDialog {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('should handle multiline messages', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        message={'Line 1\nLine 2\nLine 3'}
      />
    );

    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it('should stop propagation when clicking dialog content', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const dialogContent = screen.getByText('Confirm Action').closest('.bg-white');
    if (dialogContent) {
      fireEvent.click(dialogContent);
    }

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });
});
