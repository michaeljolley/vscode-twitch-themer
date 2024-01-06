import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import type {
  TelemetryEventProperties,
  TelemetryEventMeasurements,
} from "@vscode/extension-telemetry";

const key = "0a889129-3c63-4826-8c5b-40b268ada9b0";

export abstract class Telemetry {
  private static reporter: TelemetryReporter;

  public static initialize(context: vscode.ExtensionContext) {
    this.reporter = Telemetry.reporter = new TelemetryReporter(key);
    context.subscriptions.push(this.reporter);
  }

  public static sendTelemetryEvent(
    eventName: string,
    properties?: TelemetryEventProperties,
    measurements?: TelemetryEventMeasurements,
  ): void {
    this.reporter.sendTelemetryEvent(eventName, properties, measurements);
  }

  public static sendTelemetryErrorEvent(
    eventName: string,
    properties?: TelemetryEventProperties,
    measurements?: TelemetryEventMeasurements,
  ): void {
    this.reporter.sendTelemetryErrorEvent(eventName, properties, measurements);
  }
}
