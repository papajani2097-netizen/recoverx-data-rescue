import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FileWorkspace } from './FileWorkspace';

describe('FileWorkspace', () => {
  it('lists only files the user selected and says they remain local', () => {
    render(<FileWorkspace mode="folder" />);

    const input = screen.getByLabelText('Choose folder or files');
    fireEvent.change(input, {
      target: {
        files: [new File(['backup'], 'photo.jpg', { type: 'image/jpeg' })]
      }
    });

    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 item selected. Files remain on this device.');
    expect(screen.getByRole('button', { name: 'Download copy' })).toBeInTheDocument();
  });
});
