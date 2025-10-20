import ora, { type Ora } from "ora";

export class Logger {
  private spinner: Ora | null = null;

  info(message: string): void {
    console.log(`ℹ ${message}`);
  }

  success(message: string): void {
    console.log(`✓ ${message}`);
  }

  error(message: string, error?: unknown): void {
    console.error(`✗ ${message}`);
    if (error) {
      console.error(error);
    }
  }

  warn(message: string): void {
    console.warn(`⚠ ${message}`);
  }

  startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }
}
