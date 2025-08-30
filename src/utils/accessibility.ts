import { logger } from './logger';

// Accessibility utilities and enhancements
class AccessibilityManager {
  private focusHistory: HTMLElement[] = [];
  private liveRegions: Map<string, HTMLElement> = new Map();
  private preferredMotion: 'reduce' | 'no-preference' = 'no-preference';
  private preferredContrast: 'more' | 'less' | 'no-preference' = 'no-preference';

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Monitor user preferences
    this.detectUserPreferences();
    this.setupKeyboardNavigation();
    this.createLiveRegions();
    this.enhanceFocusManagement();
  }

  private detectUserPreferences() {
    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.preferredMotion = motionQuery.matches ? 'reduce' : 'no-preference';
    motionQuery.addEventListener('change', (e) => {
      this.preferredMotion = e.matches ? 'reduce' : 'no-preference';
      this.applyMotionPreferences();
    });

    // High contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    this.preferredContrast = contrastQuery.matches ? 'more' : 'no-preference';
    contrastQuery.addEventListener('change', (e) => {
      this.preferredContrast = e.matches ? 'more' : 'no-preference';
      this.applyContrastPreferences();
    });

    // Initial application of preferences
    this.applyMotionPreferences();
    this.applyContrastPreferences();
  }

  private applyMotionPreferences() {
    if (this.preferredMotion === 'reduce') {
      document.documentElement.classList.add('reduce-motion');
      logger.debug('Applied reduced motion preferences');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }

  private applyContrastPreferences() {
    if (this.preferredContrast === 'more') {
      document.documentElement.classList.add('high-contrast');
      logger.debug('Applied high contrast preferences');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }

  private setupKeyboardNavigation() {
    // Skip link functionality
    const skipLinks = document.querySelectorAll('[href^="#"]');
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector((e.target as HTMLAnchorElement).getAttribute('href')!);
        if (target) {
          target.setAttribute('tabindex', '-1');
          (target as HTMLElement).focus();
        }
      });
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + / for help
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }

      // Alt + M for main navigation
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const nav = document.querySelector('[role="navigation"]') as HTMLElement;
        nav?.focus();
      }

      // Alt + S for search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const search = document.querySelector('[role="search"] input') as HTMLElement;
        search?.focus();
      }

      // Escape to close modals/dropdowns
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
    });
  }

  private createLiveRegions() {
    // Status updates (polite)
    const statusRegion = document.createElement('div');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.className = 'sr-only';
    statusRegion.id = 'status-updates';
    document.body.appendChild(statusRegion);
    this.liveRegions.set('status', statusRegion);

    // Alert updates (assertive)
    const alertRegion = document.createElement('div');
    alertRegion.setAttribute('aria-live', 'assertive');
    alertRegion.setAttribute('aria-atomic', 'true');
    alertRegion.className = 'sr-only';
    alertRegion.id = 'alert-updates';
    document.body.appendChild(alertRegion);
    this.liveRegions.set('alert', alertRegion);
  }

  private enhanceFocusManagement() {
    // Track focus changes
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        // Keep history reasonable
        if (this.focusHistory.length > 20) {
          this.focusHistory = this.focusHistory.slice(-10);
        }
      }
    });

    // Add focus indicators for programmatic focus
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches(':focus-visible')) {
        target.classList.add('programmatic-focus');
      }
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target as HTMLElement;
      target?.classList.remove('programmatic-focus');
    });
  }

  // Public methods for components to use

  // Announce messages to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = this.liveRegions.get(priority === 'polite' ? 'status' : 'alert');
    if (region) {
      region.textContent = message;
      // Clear after announcement to allow repeated announcements
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
    logger.debug(`Accessibility announcement (${priority}): ${message}`);
  }

  // Focus management for modals and dialogs
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Restore focus to previously focused element
  restoreFocus() {
    if (this.focusHistory.length > 1) {
      const previousElement = this.focusHistory[this.focusHistory.length - 2];
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
        return true;
      }
    }
    return false;
  }

  // Check if element is visible to screen readers
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return !(
      element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true' ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      element.hidden ||
      style.clipPath === 'inset(50%)' ||
      (style.position === 'absolute' && 
       style.left === '-10000px' && 
       !element.classList.contains('sr-only'))
    );
  }

  // Color contrast checker
  async checkColorContrast(element: HTMLElement): Promise<{ ratio: number; level: 'AA' | 'AAA' | 'fail' }> {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // This is a simplified version - in production you'd use a proper color contrast library
    // Return mock data for now
    const ratio = 4.5; // Mock ratio
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail';
    
    return { ratio, level };
  }

  // Generate accessibility report
  generateAccessibilityReport(): {
    issues: Array<{ element: HTMLElement; issue: string; severity: 'low' | 'medium' | 'high' }>;
    summary: { total: number; byLevel: Record<string, number> };
  } {
    const issues: Array<{ element: HTMLElement; issue: string; severity: 'low' | 'medium' | 'high' }> = [];

    // Check for missing alt text on images
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt') && !img.hasAttribute('aria-label') && !img.hasAttribute('aria-labelledby')) {
        issues.push({ element: img, issue: 'Missing alt text', severity: 'high' });
      }
    });

    // Check for form inputs without labels
    document.querySelectorAll('input, select, textarea').forEach(input => {
      const hasLabel = input.hasAttribute('aria-label') || 
                     input.hasAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`) ||
                     input.closest('label');
      
      if (!hasLabel) {
        issues.push({ element: input as HTMLElement, issue: 'Form input without label', severity: 'high' });
      }
    });

    // Check for headings hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (index === 0 && level !== 1) {
        issues.push({ element: heading as HTMLElement, issue: 'First heading should be h1', severity: 'medium' });
      }
      if (level > previousLevel + 1) {
        issues.push({ element: heading as HTMLElement, issue: 'Heading hierarchy skipped', severity: 'medium' });
      }
      previousLevel = level;
    });

    // Check for interactive elements without proper roles
    document.querySelectorAll('[onclick]').forEach(element => {
      if (!element.hasAttribute('role') && !['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
        issues.push({ element: element as HTMLElement, issue: 'Interactive element without proper role', severity: 'medium' });
      }
    });

    const summary = {
      total: issues.length,
      byLevel: issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return { issues, summary };
  }

  private showKeyboardShortcuts() {
    const shortcuts = [
      'Alt + / - Show this help',
      'Alt + M - Focus main navigation',
      'Alt + S - Focus search',
      'Esc - Close modals/dropdowns',
      'Tab - Navigate forward',
      'Shift + Tab - Navigate backward'
    ];

    this.announce('Keyboard shortcuts: ' + shortcuts.join(', '));
  }

  private handleEscapeKey() {
    // Close any open modals, dropdowns, etc.
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (modal) {
      // Trigger close button click or custom close event
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"], .close') as HTMLElement;
      closeButton?.click();
      return;
    }

    // Close dropdowns
    const openDropdown = document.querySelector('[aria-expanded="true"]') as HTMLElement;
    if (openDropdown) {
      openDropdown.setAttribute('aria-expanded', 'false');
      openDropdown.click(); // Trigger to close
    }
  }

  // Cleanup method
  cleanup() {
    // Remove live regions
    this.liveRegions.forEach(region => {
      region.remove();
    });
    this.liveRegions.clear();
    this.focusHistory = [];
  }
}

// Create singleton instance
export const accessibilityManager = new AccessibilityManager();

// React hook for accessibility features
export const useAccessibility = () => {
  return {
    announce: accessibilityManager.announce.bind(accessibilityManager),
    trapFocus: accessibilityManager.trapFocus.bind(accessibilityManager),
    restoreFocus: accessibilityManager.restoreFocus.bind(accessibilityManager),
    generateReport: accessibilityManager.generateAccessibilityReport.bind(accessibilityManager),
  };
};

// Higher-order component for focus management
export const withFocusManagement = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    React.useEffect(() => {
      // Focus management logic here
      return () => {
        // Cleanup
      };
    }, []);

    return React.createElement(Component, props);
  };
};

// Utility functions
export const setFocusToFirstError = (form: HTMLFormElement) => {
  const firstError = form.querySelector('[aria-invalid="true"], .error input, .error select, .error textarea') as HTMLElement;
  if (firstError) {
    firstError.focus();
    accessibilityManager.announce('Please correct the errors in the form', 'assertive');
  }
};

export const announceRouteChange = (routeName: string) => {
  accessibilityManager.announce(`Navigated to ${routeName}`, 'polite');
};

export const createAccessibleLoadingState = (loadingMessage: string = 'Loading...') => {
  accessibilityManager.announce(loadingMessage, 'polite');
};

export default accessibilityManager;