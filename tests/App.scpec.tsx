
import { render } from '@solidjs/testing-library';
import App from '../src/App';
import { describe, expect, it } from 'vitest';

describe('App', () => {
  it('should render the app', () => {
    const { getByText } = render(() => <App/>);
    expect(getByText('Chess'))
  });
}); 