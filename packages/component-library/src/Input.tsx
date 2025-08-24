import React, {
  ChangeEvent,
  ComponentPropsWithRef,
  type KeyboardEvent,
  type FocusEvent,
  type MouseEvent,
  useRef,
} from 'react';
import { Input as ReactAriaInput } from 'react-aria-components';

import { css, cx } from '@emotion/css';

import { useResponsive } from './hooks/useResponsive';
import { styles } from './styles';
import { theme } from './theme';

// We need to check if we're in a browser environment and Firefox specifically
// This is a simple detection that works at component level
const isFirefoxBrowser = (() => {
  if (typeof navigator === 'undefined') return false;
  try {
    const userAgent = navigator.userAgent || '';
    return userAgent.toLowerCase().includes('firefox');
  } catch {
    return false;
  }
})();

export const baseInputStyle = {
  outline: 0,
  backgroundColor: theme.tableBackground,
  color: theme.formInputText,
  margin: 0,
  padding: 5,
  borderRadius: 4,
  border: '1px solid ' + theme.formInputBorder,
};

const defaultInputClassName = css({
  ...baseInputStyle,
  color: theme.formInputText,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  flexShrink: 0,
  '&[data-focused]': {
    border: '1px solid ' + theme.formInputBorderSelected,
    boxShadow: '0 1px 1px ' + theme.formInputShadowSelected,
  },
  '&[data-disabled]': {
    color: theme.formInputTextPlaceholder,
  },
  '::placeholder': { color: theme.formInputTextPlaceholder },
  ...styles.smallText,
});

export type InputProps = ComponentPropsWithRef<typeof ReactAriaInput> & {
  onEnter?: (value: string, event: KeyboardEvent<HTMLInputElement>) => void;
  onEscape?: (value: string, event: KeyboardEvent<HTMLInputElement>) => void;
  onChangeValue?: (
    newValue: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onUpdate?: (newValue: string, event: FocusEvent<HTMLInputElement>) => void;
};

export function Input({
  ref,
  onEnter,
  onEscape,
  onChangeValue,
  onUpdate,
  className,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Firefox-specific click handler to fix cursor positioning issues
  const handleClick = (e: MouseEvent<HTMLInputElement>) => {
    if (isFirefoxBrowser) {
      const input = e.currentTarget;
      const rect = input.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      // Use setTimeout to defer cursor positioning after React's event handling
      setTimeout(() => {
        if (input) {
          const textWidth = input.scrollWidth;
          const containerWidth = input.clientWidth;
          
          // Calculate approximate cursor position based on click location
          const relativeX = Math.max(0, Math.min(x, containerWidth));
          const textRatio = textWidth > 0 ? relativeX / containerWidth : 0;
          const cursorPos = Math.round(textRatio * (input.value?.length || 0));
          
          try {
            input.setSelectionRange(cursorPos, cursorPos);
          } catch {
            // Fallback: just focus the input
            input.focus();
          }
        }
      }, 0);
    }
    
    // Call original onClick if provided
    props.onClick?.(e);
  };

  return (
    <ReactAriaInput
      ref={(node) => {
        // Handle both callback refs and ref objects
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        inputRef.current = node;
      }}
      className={
        typeof className === 'function'
          ? renderProps => cx(defaultInputClassName, className(renderProps))
          : cx(defaultInputClassName, className)
      }
      {...props}
      onClick={handleClick}
      onKeyUp={e => {
        props.onKeyUp?.(e);

        if (e.key === 'Enter' && onEnter) {
          onEnter(e.currentTarget.value, e);
        }

        if (e.key === 'Escape' && onEscape) {
          onEscape(e.currentTarget.value, e);
        }
      }}
      onBlur={e => {
        onUpdate?.(e.currentTarget.value, e);
        props.onBlur?.(e);
      }}
      onChange={e => {
        onChangeValue?.(e.currentTarget.value, e);
        props.onChange?.(e);
      }}
    />
  );
}

const defaultBigInputClassName = css({
  padding: 10,
  fontSize: 15,
  border: 'none',
  ...styles.shadow,
  '&[data-focused]': { border: 'none', ...styles.shadow },
});

export function BigInput({ className, ...props }: InputProps) {
  return (
    <Input
      {...props}
      className={
        typeof className === 'function'
          ? renderProps => cx(defaultBigInputClassName, className(renderProps))
          : cx(defaultBigInputClassName, className)
      }
    />
  );
}

export function ResponsiveInput(props: InputProps) {
  const { isNarrowWidth } = useResponsive();

  return isNarrowWidth ? <BigInput {...props} /> : <Input {...props} />;
}
