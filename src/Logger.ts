import { OutputChannel } from "vscode";

import { LogLevel } from './Enum';

export class Logger {
  private readonly _channel?: OutputChannel

  constructor (outputChannel?: OutputChannel, thisArgs?: any) {
    this._channel = outputChannel;
    this.log = this.log.bind(thisArgs || this);
  }

  public debug(message: string, ...optionalParams: any[]): void {
    this.log(message, LogLevel.Debug, ...optionalParams);
  }

  public error(message: string, ...optionalParams: any[]): void {
    this.log(message, LogLevel.Error, ...optionalParams);
  }

  public log(message: string, logLevel?: LogLevel, ...optionalParams: any[]): void {
    const captains: any = console;

    let level = logLevel || LogLevel.Information;

    const getTime = (): {
      hours: string;
      minutes: string;
      seconds: string;
    } => {
      const date = new Date();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const prefix = (value: number): string => {
        return value < 10 ? `0${value}` : `${value}`;
      };
      return {
        hours: prefix(hours),
        minutes: prefix(minutes),
        seconds: prefix(seconds)
      };
    };

    const { hours, minutes, seconds } = getTime();
    const log = `[${hours}:${minutes}:${seconds}] ${message}`;

    captains[level](log, ...optionalParams);

    if (this._channel && level !== LogLevel.Debug) {
      this._channel.appendLine(log);
    }
  }
}